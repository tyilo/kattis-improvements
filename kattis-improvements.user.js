// ==UserScript==
// @name         Kattis Improvements
// @namespace    https://tyilo.com/
// @version      0.5.5
// @description  ...
// @author       Tyilo
// @match        https://*.kattis.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

// The problem page can have a contest prefix and a language suffix.
var problemPathRegex = '(?:/contests/[^/]+)?/problems/([^/]+)(?:/[^/]+)?';

var features = [
    {
        name: 'Wider instructions',
        default: true,
        function: widenInstructions,
        pathRegex: problemPathRegex,
    },
    {
        name: 'Show influence',
        default: true,
        function: addInfluence,
        pathRegex: '/(universities|countries)/[^/]+',
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
    {
      name: 'Penalty lower bound',
      default: true,
      function: penaltyLowerBound,
      pathRegex: '.*\/standings(\/?)[^/]*',
    }
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

    var dropdown = document.querySelector('#top_user_menu .collapsible-menu-content');
    var dropDownList;
    // If the user is not logged in the dropdown element is replaced with a
    // login button. We guard against that here and accept that the enabled
    // features will work but the feature togglers will not be shown.
    if(dropdown !== null) {
        dropdown.prepend(document.createElement('hr'));
        dropdown.prepend(dropDownList = document.createElement('ul'));
    }

    for (var feature of features) {
        var enabled = GM_getValue(feature.name, feature.default);
        if (enabled && document.location.pathname.match(new RegExp('^' + feature.pathRegex + '$')))
            feature.function();

        if(dropDownList) {
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

            dropDownList.appendChild(li);
        }
    }
}

init();

function widenInstructions() {
    // Makes the width of the problem instructions match the old Kattis layout
    document.getElementById("instructions-container")
        .setAttribute("style", "flex: 0 1 900px; max-width: none");
    document.querySelector("#instructions-container > article > div")
        .setAttribute("style", "max-width: none; margin: 0 auto");
}

function addInfluence() {
    var f = 5;

    var tables = document.querySelectorAll('main table.table2');

    var university_page = location.pathname.match(/^\/universities\//);
    var table;
    if (university_page) {
        table = tables[0];
    } else {
        table = tables[1];
    }

    table.querySelector('thead tr').innerHTML += '<th class="table-item-autofit">Influence</th>';
    var rows = table.querySelectorAll('tbody tr');
    for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var score = parseFloat(row.querySelector('td:last-of-type').textContent);
        var fraction = 1/f * Math.pow(1 - 1/f, i);
        var influence = fraction * score;
        row.innerHTML += '<td class="table-item table-item-autofit table-align-right">' + influence.toFixed(1) + ' (' + (fraction * 100).toPrecision(2) + ' %)</td>';
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
    var diffCells = document.querySelectorAll('.table-wrapper > table.table2 > * > * > *:nth-child(8)');
    for (var cell of  diffCells) {
        cell.parentNode.removeChild(cell);
    }
}

function autoRefresh() {
    setTimeout(() => {
        window.location.reload();
    }, 10 * 1000);
}

function penaltyLowerBound() {
    function inject() {
        const table = document.querySelector('.standings-table');
        if (!table || table.classList.contains('min-penalty-computed'))
            return;

        const remainingTimeStr = document.querySelector('.count_remaining').textContent;

        const parts = remainingTimeStr.match(/(\d+)h (\d+)m (\d+)s/);
        if (!parts)
            return;

        table.classList.add('min-penalty-computed');

        const timeRemaining = parseInt(parts[1]) * 60 + parseInt(parts[2]);
        const currentPenalty = 5 * 60 - timeRemaining;

        const minPenalties = [];

        for (const row of [...table.querySelectorAll('tbody > tr')]) {
            if (!row.querySelector('.standings-cell--expand'))
                continue;

            const problems = row.querySelectorAll('.standings-cell-problem').length || (row.querySelectorAll('td').length - 4);
            const solved = row.querySelectorAll('.solved, .first').length;

            let triesNotCompleted = 0;
            for (const notCompleted of row.querySelectorAll('.pending, .attempted')) {
                triesNotCompleted += notCompleted.textContent.trim().split(/\s+/)[0].split('+').map(v => parseInt(v)).reduce((a, b) => a + b);
            }

            const minExtraPenalty = (problems - solved) * currentPenalty + triesNotCompleted * 20;
            const penaltyElement = row.querySelector('.standings-cell-time');

            const minPenalty = parseInt(penaltyElement.textContent) + minExtraPenalty;

            penaltyElement.textContent += ` (${minPenalty})`;

            minPenalties.push(minPenalty);
        }

        let i = 0;
        for (const row of [...table.querySelectorAll('tbody > tr')]) {
            if (!row.querySelector('.standings-cell--expand'))
                continue;


            const minPenalty = minPenalties[i];
            const couldBeBetter = minPenalties.slice(i + 1).filter(v => minPenalty >= v).length;

            const rankElement = row.querySelector('td.font-bold');
            const rank = parseInt(rankElement.textContent);

            rankElement.textContent += ` (${rank + couldBeBetter})`;

            i++;
        }
    }

    inject();
    setInterval(inject, 1000);
}
