// ==UserScript==
// @name         Kattis Improvements
// @namespace    https://tyilo.com/
// @version      0.3.0
// @description  ...
// @author       Tyilo
// @match        https://*.kattis.com/*
// @grant        none
// ==/UserScript==

var funcs = [
    [addInfluence, ['/universities/[^/]+', '/countries/[^/]+']],
    [autoUpdateJudgement, ['/submissions/[^/]+']],
    //[autoLanguage, ['/problems/[^/]+/submit']],
    [resubmitLink, ['/submissions/[^/]+']],
    [noDifficulty, ['/problem-sources/[^/]+']],
];

for(var i = 0; i < funcs.length; i++) {
    var f = funcs[i][0];
    var regexps = funcs[i][1];
    for(var j = 0; j < regexps.length; j++) {
        if(document.location.pathname.match(new RegExp('^' + regexps[j] + '$'))) {
            f();
            break;
        }
    }
}

function addInfluence() {
    var f = 5;

    var tables = document.querySelectorAll('.main-content table');
    var table = tables[tables.length - 1];
    table.querySelector('thead tr').innerHTML += '<th>Influence</th>';
    var rows = table.querySelectorAll('tbody tr');
    for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var score = parseFloat(row.querySelector('td:last-of-type').textContent);
        var influence = 1/f * Math.pow(1 - 1/f, i) * score;
        row.innerHTML += '<td>' + influence.toFixed(1) + '</td>';
    }
}

function autoUpdateJudgement() {
    function getStatus() {
        return document.querySelector('.status').textContent;
    }

    function isDone() {
        return getStatus() !== 'Running';
    }

    function refreshResults() {
        fetch(location.href, {credentials: 'include'})
        .then(response => response.text())
        .then(html => {
            var template = document.createElement('template');
            template.innerHTML = html;
            var el1 = document.querySelector('#judge_table');
            var el2 = template.content.querySelector('#judge_table');
            if (!el1) {
                if (!el2) {
                    setTimeout(refreshResults, 500);
                } else {
                    location.reload();
                }
            } else {
                el1.replaceWith(el2);
                if (isDone()) {
                    location.reload();
                } else {
                    setTimeout(refreshResults, 500);
                }
            }
        });
    }

    if (!isDone()) {
        refreshResults();
    }
}

function autoLanguage() {
    var map = {
        '.py': 'Python 3',
        '.cpp': 'C++',
        '.java': 'Java'
    };

    var input = document.getElementById('sub_files_input');
    input.addEventListener('change', function() {
        console.log(input.files, input.files.length);
        if(input.files.length > 0) {
            var ext = input.files[0].name.match(/\.[^.]+$/);
            var type = map[ext];
            if(type) {
                document.getElementById('language_select').value = type;
                document.getElementById('select2-chosen-2').textContent = type;
            }
        }
    });
}

function resubmitLink() {
    var problem_link = document.querySelector('a[href^="/problems/"]');
    var resubmit_link = document.createElement('a');
    resubmit_link.href = problem_link.href + '/submit';
    resubmit_link.textContent = '(resubmit)';
    document.querySelector('h1').appendChild(document.createTextNode(' '));
    document.querySelector('h1').appendChild(resubmit_link);
}

function noDifficulty() {
    var diffCells = document.querySelectorAll('#problem_list_wrapper > table > * > * > *:nth-child(9)');
    for (var i = 0; i < diffCells.length; i++) {
        var cell = diffCells[i];
        cell.parentNode.removeChild(cell);
    }
}
