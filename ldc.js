function TranslateLanguage(lang){
    if (lang === "de"){
      return 1;
    }
    return 2;
}
function GetSystemValue(ldc,needle){
        for (var i = 0; i < ldc.systemVars.length; i++) {
                if (ldc.systemVars[i].Val == needle){
                        return ldc.systemVars[i].Text;
                }
       	}
        return "";
}
function UI(){
   $(".ldcui").each(function(index, value) {
          var id = $(this).attr('id');
          var value = GetSystemValue(ldc,id);
          if (id == undefined || value == "")
          {
              //for elements with duplicate context
              var classes = $(this).attr("class").split(' ');
              id = classes[classes.length -1];
              value = GetSystemValue(ldc,id);
          }
          if (value != "")
                      $(this).html(value);
      });
}
function loadingText(){
    var texts = ["something","foobar","bla","foo","some","shit"];
    var index = Math.floor((Math.random() * texts.length) );
    $(".loader p").text(texts[index]+"...");
}
var ldc = function(){
	this.backend = "https://distrochooser.de/rest.php?json&ldc3";
  this.Title = "Linux Auswahlhilfe",
  this.version = "3.0 (2016)";
  this.lang = "de";
	this.distributions = [];
  this.systemVars = null;
	this.questions = [
    {
      "Id":"welcome",
      "Text":"Willkommen",
      "HelpText":"Wilkommen bla bla",
      "Important":false,
      "SingleAnswer":false,
      "Answers":[
      ]
    }
	];
};
//Do some init stuff
ldc = new ldc();
Vue.http.options.emulateJSON = true;
vm = new Vue({
  el: '#app',
  data: {
    ldc: ldc, //ldc data instance
    debug: true, //debug mode?
    answered: 0, //the count of answered questions
    tags: {}, //the answered tags
    results: ldc.distributions, //the resulting distros
    comment: "", //the user's comment for the result
    commentSent: false,
    testCount: 0,
    loaded: false
  },
  created: function(){
     this.$http.post(ldc.backend,{method:'GetDistributions',args: "[]", lang:  TranslateLanguage(ldc.lang)}).then(function(data){
        loadingText();
        var result = JSON.parse(data.body);
          ldc.distributions = [];
          for(var i = 0; i < result.length;i++){
            //translate the 2.x API for 3.x
            var distro = {};
            distro.Id = result[i].Id;
            distro.Name = result[i].Name;
            distro.Image = result[i].Image;
            distro.Color = result[i].Color;
            distro.Description = result[i].Description;
            distro.Percentage = 0;
            distro.Tags = [];
            try {
              distro.Tags = JSON.parse(result[i].Tags);
            } catch (error) {
              console.log(distro);
            }
            ldc.distributions.push(distro);
          }
      }).then(
       function(){
          this.$http.post(ldc.backend,{method:'GetQuestions',args: "[]", lang:  TranslateLanguage(ldc.lang)}).then(function(data){
            loadingText();
            var result = JSON.parse(data.body);
            for(var i = 0; i < result.length;i++){
                //translate the 2.x API for 3.x
                var question = {};
                question.Id = "q"+result[i].Id;
                question.Text = result[i].Text;
                question.HelpText = result[i].Help;
                question.Important = false; //TODO: Insert into DB
                question.SingleAnswer = true; //TODO: Insert into DB
                question.Answers = [];
                for(var x=0;x < result[i].Answers.length;x++){
                  var answer = {};
                  answer.Id = "a"+result[i].Answers[x].Id;
                  answer.Text = result[i].Answers[x].Text;
                  try {
                    answer.Tags = JSON.parse(result[i].Answers[x].Tags);
                  } catch (error) {

                  }
                  answer.Selected = false;
                  question.Answers.push(answer);
                }
                ldc.questions.push(question);
              }
          })
       }
      ).then(
        function(){
             this.$http.post(ldc.backend,{method:'GetSystemVars',args: "[]", lang:  TranslateLanguage(ldc.lang)}).then(function(data){
                    loadingText();
                    ldc.systemVars = JSON.parse(data.body);
                    UI();
             });
        } 
      ).then(
        function(){
             this.$http.post(ldc.backend,{method:'GetTestCount',args: "[]", lang:  TranslateLanguage(ldc.lang)}).then(function(data){
                  loadingText();
                  this.testCount = data.body;
             });
             this.testCount = parseInt(this.testCount );
        }
      ).then(
        function(){
           this.loaded = true;
        }
      );
  },
  computed: {
    ratingSent : function (){
        return false;
    },
    answeredQuestionsCount: function(){
      this.answered =  this.answeredQuestions();
      return this.answered.length;
    },
    questionsCount: function(){
      var count = 0;
      for(var i = 0; i < ldc.questions.length;i++){
        if (ldc.questions[i].Answers.length !== 0){
          count++;
        }
      }
      return count;
    },
    currentTags: function(){
      //get the currently answered tags
      this.tags = {};
      for (var i = 0; i < ldc.questions.length;i++){
        var q = ldc.questions[i];
        for(var x = 0;  x < q.Answers.length;x++){
          if (q.Answers[x].Selected === true){
            for(var y = 0 ; y < q.Answers[x].Tags.length; y++){
              var weight = 1;
              var tag = q.Answers[x].Tags[y];
              if (Object.keys(this.tags).indexOf(tag) === -1){
                this.tags[tag] = weight;
              }else{
                this.tags[tag]++;
              }
              if (q.Important){
                this.tags[tag] *=2;
              }
            }
          }
        }
      }
      console.log(this.tags);
      return this.tags;
    },
    distributionsCount : function (){
      
      return this.distributions.length;
    },
    allDistributionsCount : function (){
      return ldc.distributions.length;
    },
    distributions : function(){
      //Reset percentages if needed
      if (Object.keys(this.currentTags).length === 0){  
        for (var i = 0; i < ldc.distributions.length;i++){
          ldc.distributions[i].Percentage = 0;
        }
        return ldc.distributions;
      }
      this.results = [];
      var pointSum = 0;
       for (var tag in this.currentTags) {
          var weight = this.currentTags[tag];
          pointSum += weight;
        }
      for (var i = 0; i < ldc.distributions.length;i++){
        var distro = ldc.distributions[i];
        var points = 0;
        var hittedTags = 0;
        for (var tag in this.currentTags) {
          var weight = this.currentTags[tag];
          //get percentage
          if (distro.Tags.indexOf(tag) !== -1){
            points += weight;
            hittedTags++;
          }
        }
        if (points > 0){
          distro.Percentage = Math.round(100 / (pointSum/points),2);
        }else{
          distro.Percentage = 0;
        }
      
        if (distro.Percentage > 0){
          this.results.push(distro);
        } 
      }
      return this.results;
    }
  },
  methods: {
    answeredQuestions: function(){
      var answered = [];
      for (var i = 0; i < ldc.questions.length;i++){
        for(var x = 0;  x < ldc.questions[i].Answers.length;x++){
          if (ldc.questions[i].Answers[x].Selected){
            answered.push(ldc.questions[i]);
            break;
          }
        }
      }
      return answered;
    },
  	getAnswer : function(id){
  		for (var i = 0; i < ldc.questions.length;i++){
  			for(var x = 0;  x < ldc.questions[i].Answers.length;x++){
  				if (ldc.questions[i].Answers[x].Id === id){
  					return ldc.questions[i].Answers[x];
  				}
  			}
  		}
  		return null;
  	},
    getQuestionByAnswer : function(id){
      for (var i = 0; i < ldc.questions.length;i++){
        for(var x = 0;  x < ldc.questions[i].Answers.length;x++){
          if (ldc.questions[i].Answers[x].Id === id){
            return ldc.questions[i];
          }
        }
      }
      return null;
    },
    getQuestion : function(id){
      for (var i = 0; i < ldc.questions.length;i++){
        if (ldc.questions[i].Id === id){
            return ldc.questions[i]   
        }
      }
      return null;
    },
  	selectAnswer : function (id){
  		var answer = this.getAnswer(id);
  		if (answer !== null && !answer.Selected){
  			answer.Selected = true;
  			return answer.Selected;
  		}
  		else if (answer.Selected){
        answer.Selected = false;
  			return answer.Selected;
  		}
      else{
        return false;
      }
  	},
    makeImportant : function (args){
      args.preventDefault();
      var question = this.getQuestion(args.srcElement.attributes[2].value);
      if (question !== null){
          if (question.Important){
            question.Important = false;
          }else{
            question.Important = true;
          }
        return question.Important;
      }else{
        return false;
      }
    },
  	addAnswer : function(args){
      args.preventDefault();
      var id = args.srcElement.attributes[2].value;
      //prevent multiple answers on singleanswer question
      var parent = this.getQuestionByAnswer(id);
      if (parent !== null && parent.SingleAnswer === true){
        for(var a = 0; a < parent.Answers.length;a++){
            if (parent.Answers[a].Selected === true && parent.Answers[a].Id !== id){
              this.nomultipleAnswersAllowed();
              return false;
            }
        }
      }
  		var answer = this.selectAnswer(args.srcElement.attributes[2].value);
  		return answer;
  	},
    nomultipleAnswersAllowed : function(){
      alert("das ist nicht erlaubt");
    },
    publishRating : function(args){
      var rating = $("#rating-stars").rateYo().rateYo("rating");
      var _this = this;
      var c = this.comment;
      this.$http.post(ldc.backend,{method:'NewRatingWithComment',args: "["+rating+",\""+c+"\"]", lang:  TranslateLanguage(ldc.lang)}).then(function(data){
          this.commentSent = true;
      });
    },
    addResult: function (args){
      this.$http.post(ldc.backend,{method:'AddResult',args: JSON.stringify(ldc.distributions), lang:  TranslateLanguage(ldc.lang)}).then(function(data){
        console.log("Stored result");
      });
    }
  }
});