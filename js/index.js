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

function compileTemplates() {
    jobsListTemplate = $('#job-list-template').html();
    jobsListTemplate = Handlebars.compile(jobsListTemplate);
}

function renderJobsList () {
    var jobsListHTML = jobsListTemplate(model);
    $('#postingsList').html(jobsListHTML);
}

// Controller

function setup() {
    compileTemplates();
    renderJobsList();
}



$(document).ready(setup);