// Model
var model= {
    user: {},
    jobs: [
        {
            guid:1,
            title:'Job 1',
            organization:'CREC',
            location:'Arlington, VA',
            description:'Job Desc',
            pubDate:'5/28/2016',
            expirationDate:'',
            filledDate:'',
            source:'/',
            sourceText:'More Info'
        },
        {
            guid:2,
            title:'Job 2',
            organization:'C2ER',
            location:'Rosslyn, VA',
            description:'Job Desc',
            pubDate:'4/2/2016',
            expirationDate:'4/28/2016',
            filledDate:'',
            source:'/',
            sourceText:'More Info'
        }
    ]
}

// View
var jobsListTemplate;
var monthNames = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

Handlebars.registerHelper('formatDate', function(date) {
  var date = new Date(date);
  date = monthNames[date.getUTCMonth()] + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear();

  return date;
});

function compileTemplates() {
    loginTemplate = $('#login-template').html();
    loginTemplate = Handlebars.compile(loginTemplate);

    jobsListTemplate = $('#jobs-list-template').html();
    jobsListTemplate = Handlebars.compile(jobsListTemplate);
}

function renderLogin() {
	var loginHtml = loginTemplate(model);
	$('#loginForm').html(loginHtml);
}

function renderJobsList () {
    var jobsListHTML = jobsListTemplate(model);
    $('#jobsList').html(jobsListHTML);
}

function renderNewJob () {
    var tempmodel = {
        jobs: [model.jobs[model.jobs.lengthd-1]]
    };
    var jobsListHTML = jobsListTemplate(tempmodel);
    $('#jobsList').prepend(jobsListHTML);
}

function processJobs (snapshot){
	console.log('db update callback');
	model.jobs = snapshot.val();
	renderJobsList();
}



// Controller

function setup() {
    compileTemplates();
    renderLogin();
    renderJobsList();

    //Auth
	$('#loginForm').on('click', '#register', handleRegistration);
	$('#loginForm').on('click', '#login', handleLogin);
	$('#loginForm').on('click', '#signOut', handleSignOut);
	firebase.auth().onAuthStateChanged(handleAuthStateChange);


    $('#jobForm').on('click', '#addJob', handleAddJob);
    firebase.database().ref('jobs').on('value', processJobs);
}

function handleRegistration() {
	console.log('register');
	var email = $('input[name="email"]').val();
	var password = $('input[name="password"]').val();

	firebase.auth().createUserWithEmailAndPassword(email, password);
}

function handleLogin() {
	console.log('login');
	var email = $('input[name="email"]').val();
	var password = $('input[name="password"]').val();

	firebase.auth().signInWithEmailAndPassword(email, password);
}

function handleSignOut() {
	console.log('sign out');
	firebase.auth().signOut();
}

function handleAuthStateChange() {
	console.log('auth state change');
	var user = firebase.auth().currentUser;

	if (user) {
		model.loggedIn = true;
		model.user = user;

		//firebase.database().ref('jobs').on('value', processMessages);
	} else {
		model.loggedIn = false;
		model.user = user;
	}
	renderLogin();
	//renderChat();
}


function handleAddJob () {
    /*model.jobs.push({
        guid:3,
        title: $('input[name="title"]').val(),
        organization: $('input[name="organization"]').val(),
        location: $('input[name="location"]').val(),
        description: $('textarea[name="description"]').val(),
        pubDate: Date.parse($('input[name="datePosted"]').val()),
        expirationDate: Date.parse($('input[name="dateExpires"]').val()),
        filledDate:'',
        source:'/',
        sourceText:'More Info'
    })*/
	console.log('add job');
	//if (message){
    firebase.database().ref('jobs').push({
        guid:3,
        title: $('input[name="title"]').val(),
        organization: $('input[name="organization"]').val(),
        location: $('input[name="location"]').val(),
        description: $('textarea[name="description"]').val(),
        pubDate: $('input[name="datePosted"]').val(),
        expirationDate: $('input[name="dateExpires"]').val(),
        filledDate:'',
        source:'/',
        sourceText:'More Info'
		});
	//}
    //renderJobsList();
}



$(document).ready(setup);