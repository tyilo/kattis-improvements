// ==UserScript==
// @name         Kattis Improvements
// @namespace    https://tyilo.com/
// @version      0.4.3
// @description  ...
// @author       Tyilo
// @match        https://*.kattis.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

var features = [
    {
        name: 'Show influence',
        default: true,
        function: addInfluence,
        pathRegex: '/(universities|countries)/[^/]+',
    },
    {
        name: 'Auto update judgement',
        default: true,
        function: autoUpdateJudgement,
        pathRegex: '/submissions/[^/]+',
    },
    {
        name: 'Hide difficulty',
        default: false,
        function: noDifficulty,
        pathRegex: '/problem-sources/[^/]+',
    },
    {
        name: 'Auto refresh',
        default: false,
        function: autoRefresh,
        pathRegex: '.*',
    },
];

function init() {
    function insertAfter(node, newNode) {
        node.parentNode.insertBefore(newNode, node.nextSibling);
    }

    function updateSetting(checkbox) {
        GM_setValue(checkbox.getAttribute('data-name'), checkbox.checked);
    }

    function featureToggled(e) {
        updateSetting(e.target);
    }

    function lineClicked(e) {
        e.stopPropagation();
        if (e.target !== e.currentTarget) return;

        var checkbox = e.target.querySelector('input');
        checkbox.checked = !checkbox.checked;

        updateSetting(checkbox);
    }

    var dropdown = document.querySelector('#top_user_tooltip ul.main_menu');
    var divider = document.createElement('hr');
    dropdown.prepend(divider);

    for (var feature of features) {
        var enabled = GM_getValue(feature.name, feature.default);
        if (enabled) {
            if (document.location.pathname.match(new RegExp('^' + feature.pathRegex + '$'))) {
                feature.function();
            }
        }

        var li = document.createElement('li');
        li.setAttribute('style', 'user-select: none;');
        var a = document.createElement('a');
        a.setAttribute('class', 'main_menu-item main_menu-item_link profile_menu-item');

        var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('data-name', feature.name);
        checkbox.checked = enabled;
        checkbox.addEventListener('change', featureToggled);

        a.appendChild(checkbox);
        a.appendChild(document.createTextNode(' ' + feature.name));
        a.addEventListener('click', lineClicked);

        li.appendChild(a);

        dropdown.insertBefore(li, divider);
    }
}

init();

function addInfluence() {
    var f = 5;

    var tables = document.querySelectorAll('.main-content table.table-kattis');

    var university_page = location.pathname.match(/^\/universities\//);
    var table;
    if (university_page) {
        table = tables[0];
    } else {
        table = tables[1];
    }

    table.querySelector('thead tr').innerHTML += '<th>Influence</th>';
    var rows = table.querySelectorAll('tbody tr');
    for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var score = parseFloat(row.querySelector('td:last-of-type').textContent);
        var fraction = 1/f * Math.pow(1 - 1/f, i);
        var influence = fraction * score;
        row.innerHTML += '<td>' + influence.toFixed(1) + ' (' + (fraction * 100).toPrecision(2) + ' %)</td>';
    }
}

function autoUpdateJudgement() {
    function getStatus() {
        return document.querySelector('.status').textContent;
    }

    function isDone() {
        return ['New', 'Running'].indexOf(getStatus()) === -1;
    }

    async function refreshResults() {
        var response = await fetch(location.href, {credentials: 'include'});
        var html = await response.text();
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
    }

    if (!isDone()) {
        refreshResults();
    }
}

/*
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
*/

function noDifficulty() {
    var diffCells = document.querySelectorAll('#problem_list_wrapper > table > * > * > *:nth-child(9)');
    for (var cell of  diffCells) {
        cell.parentNode.removeChild(cell);
    }
}

function autoRefresh() {
    setTimeout(() => {
        window.location.reload();
    }, 10 * 1000);
}
