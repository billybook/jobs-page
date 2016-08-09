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
  date = monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

  return date;
});

function compileTemplates() {
    jobsListTemplate = $('#jobs-list-template').html();
    jobsListTemplate = Handlebars.compile(jobsListTemplate);
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



// Controller

function setup() {
    compileTemplates();
    renderJobsList();

    $('#jobForm').on('click', '#addJob', addJob);
}

function addJob () {
    model.jobs.push({
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
    })

    renderJobsList();
}



$(document).ready(setup);