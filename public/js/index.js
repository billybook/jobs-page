// Model
var model= {
    user: {},
    jobs: [
        /*{
            guid:1,
            uid: '',
            status: '',
            title:'Job 1',
            organization:'CREC',
            location:'Arlington, VA',
            description:'Job Desc',
            pubDate:'5/28/2016',
            expirationDate:'',
            filledDate:'',
            source:'/',
            sourceText:'More Info'
        }*/
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

    currentJobTemplate = $('#current-job-template').html();
    currentJobTemplate = Handlebars.compile(currentJobTemplate);
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
        jobs: [model.jobs[model.jobs.length-1]]
    };
    var jobsListHTML = jobsListTemplate(tempmodel);
    $('#jobsList').prepend(jobsListHTML);
}

function processJobs (snapshot){
	console.log('db update callback');
	model.jobs = snapshot.val();
    for(var index in model.jobs) {
        model.jobs[index].canEdit = model.user && (model.jobs[index].uid===model.user.uid || model.user.usertype ==='admin'); 
    }
	renderJobsList();
}

function renderCurrentJob () {
    console.log('show job');
    var currentKey = $(this).attr('data-id');
    var currentJob = {};
    if (currentKey) {
        currentJob = model.jobs[currentKey];
        currentJob.key = currentKey;
    }
    var currentJobHTML = currentJobTemplate(currentJob);

    $('#currentPosting').html(currentJobHTML);

    $('.datepicker').datepicker();
    tinymce.init({
        selector: '[name="description"]',
        menubar: false,
        toolbar: 'undo redo styleselect bold italic bullist numlist code', //alignleft aligncenter alignright outdent indent
        plugins: 'code',
        inline: true
    });
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

    //DB Interaction
    $('#currentPosting').on('click', '#addJob', handleAddJob);
	$('#currentPosting').on('click', '.delete', handleDelete);
    firebase.database().ref('jobs').on('value', processJobs);


    $('#jobsList').on('click', '.posting', renderCurrentJob);
    $('body').on('click', '#addNew', renderCurrentJob);
}

function handleRegistration() {
	console.log('register');
    var displayName = $('input[name="displayName"]').val();
	var email = $('input[name="email"]').val();
	var password = $('input[name="password"]').val();

	firebase.auth().createUserWithEmailAndPassword(email, password).then(function(result) {
        // The firebase.User instance:
        var user = result;
        firebase.database().ref('users/' + user.uid).set({
            displayName: displayName,
            email: user.email,
            usertype:''
        });
    });
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
        firebase.database().ref('/users/' + user.uid).once('value').then(function(snapshot) {
            model.user.displayName = snapshot.val().displayName;
            model.user.usertype = snapshot.val().usertype;

            renderLogin();
            firebase.database().ref('jobs').once('value', processJobs);
        });

        //TODO:  Reload view to show users drafts/pending
		//firebase.database().ref('jobs').on('value', processMessages);
	} else {
		model.loggedIn = false;
		model.user = user;

        renderLogin();
        firebase.database().ref('jobs').once('value', processJobs);
	}
}


function handleAddJob () {
	console.log('add job');
    firebase.database().ref('jobs').push({
        guid:3,
        uid: model.user.uid,
        status: 'pending',
        title: $('input[name="title"]').val(),
        organization: $('input[name="organization"]').val(),
        location: $('input[name="location"]').val(),
        description: $('div[name="description"]').html(),
        pubDate: $('[name="pubDate"] input').val(),
        expirationDate: $('[name="expirationDate"] input').val(),
        filledDate:'',
        source:'/',
        sourceText:'More Info'
		});
    $('#currentPosting').empty();
}

function handleDelete() {
	console.log('delete');
	var messageId = $(this).parent().attr('data-id');

	firebase.database().ref('jobs').child(messageId).remove();
    $('#currentPosting').empty();
}




$(document).ready(setup);