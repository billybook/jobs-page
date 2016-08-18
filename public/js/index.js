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
    $('#jobsList').empty();
    model.jobs.forEach(function(job){
        var jobsListHTML = jobsListTemplate(job);
        $('#jobsList').append(jobsListHTML);
    });
}

function processJobs (snapshot){
	console.log('db update callback');
    model.jobs = [];
    snapshot.forEach(function(job){
        canEdit = '';
        if (model.user) {
            canEdit = (model.user.usertype ==='admin') ? 'admin' : (job.val().uid===model.user.uid) ? 'user' : '';
        }
        if (job.val().status || canEdit) {
            jobTemp = job.val();
            jobTemp.key = job.key;
            jobTemp.canEdit = canEdit;
            model.jobs.push(jobTemp);
        }
    });
    model.jobs.sort(function(a,b){
        if (a.status===b.status) {
            return b.pubDate-a.pubDate;
        } else {
            return a.status-b.status;
        }
    });

	renderJobsList();
}

function renderCurrentJob () {
    console.log('show job');
    var currentKey = $(this).attr('data-id');
    var currentJob = model.jobs.filter(function( obj ) {
        return obj.key == currentKey;
    });
    if (!currentJob[0]) {
        currentJob[0] = {pubDate: Date.now()}
    }
    var currentJobHTML = currentJobTemplate(currentJob[0]);

    $('#currentPosting').html(currentJobHTML);

    $('.datepicker').datepicker({
        dateFormat: "MM d, yy"
    });
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
    $('#currentPosting').on('click', '[name="status"]', handleApproveJob);
    $('#currentPosting').on('change', '[name="fileUpload"]', handleFileUpload);
	$('#currentPosting').on('click', '.delete', handleDelete);


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
            firebase.database().ref('jobs').on('value', processJobs);
        });

        //TODO:  Reload view to show users drafts/pending
		//firebase.database().ref('jobs').on('value', processJobs);
	} else {
		model.loggedIn = false;
		model.user = user;

        renderLogin();
        firebase.database().ref('jobs').on('value', processJobs);
	}

}

function handleFileUpload () {
    var selectedFile = $(this)[0].files[0];
    console.log('upload file '+selectedFile.name);
    if ( $('input[name="title"]').val() && $('input[name="organization"]').val() && $('[name="pubDate"] input').val()) {
        var pubDate = new Date($('[name="pubDate"] input').val());
        var nameExt = selectedFile.name.split('.');
        
        var monthTemp = (pubDate.getMonth() <10) ? '0'+pubDate.getMonth() : pubDate.getMonth();
        var newFileName = pubDate.getFullYear() + '-' + monthTemp + '-' + pubDate.getDate() + '-';
            newFileName + encodeURIComponent(cleanName($('input[name="title"]').val())) + '-';
            newFileName += encodeURIComponent(cleanName($('input[name="organization"]').val()));
            newFileName += '.' + nameExt[nameExt.length -1];
        
        var uploadJob = firebase.storage().ref('jobs/'+newFileName).put(selectedFile);

        uploadJob.on('state_changed', function(snapshot){
            // Observe state change events such as progress, pause, and resume
            // See below for more detail
        }, function (error) {
            console.log(error);
            // Handle unsuccessful uploads
        }, function () {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            var downloadURL = uploadJob.snapshot.downloadURL;
            console.log(downloadURL);
            $('[name="source"]').val(downloadURL);
            $('[name="moreInfo"]').attr('href', downloadURL);
        });
    }
}

function handleAddJob () {
	console.log('add job');
    firebase.database().ref('jobs').limitToLast(1).once('value', function(lastJob){
        nextGUID = lastJob.val()[Object.keys(lastJob.val())].guid + 1;
        firebase.database().ref('jobs').push({
            guid:nextGUID,
            uid: model.user.uid,
            uname: model.user.displayName,
            status: 0,
            title: $('input[name="title"]').val(),
            organization: $('input[name="organization"]').val(),
            location: $('input[name="location"]').val(),
            description: $('div[name="description"]').html(),
            dateSort: Date.parse($('[name="pubDate"] input').val() + '  07:00:00 +0400')*-1,
            pubDate: Date.parse($('[name="pubDate"] input').val() + '  07:00:00 +0400'),
            expirationDate: ($('[name="expirationDate"] input').val()) ? Date.parse($('[name="expirationDate"] input').val() + '  20:00:00 +0400') : null,
            filledDate:'',
            source:$('input[name="source"]').val(),
            sourceText:'More Info'
        });
    });

    $('#currentPosting').empty();
}
function handleApproveJob (){
    console.log('approve job');
    var jobId = $(this).closest('[data-id]').attr('data-id');
    var status = ($(this).is(":checked")) ? 1 : 0;

    firebase.database().ref('jobs/'+jobId+'/status').set(status);
}
function handleDelete() {
	console.log('delete');
	var jobId = $(this).closest('[data-id]').attr('data-id');

	firebase.database().ref('jobs').child(jobId).remove();
    $('#currentPosting').empty();
}



function cleanName(name) {
    var chars = [' ','/','(', ')', '\\', '&', ','];
    chars.forEach(function(char){
        name = name.split(char);
        name = name.join('');
    });
    return name;
}



$(document).ready(setup);