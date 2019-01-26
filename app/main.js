let app = {
    version: '2.4.2',
    releaseDate: 1548190000000,
    rangeCache: {},
    focusID: false,
    settings: {
        charSearch: '',
        rememberSettings: false,
        maxSearchResults: 1000,
        selectedTab: 'Grouped',
        selectedRanges: ['r-0020-007F'],
        genericFontFamily: 'sans-serif',
        favorites: [],
    }
};

function init(){
    loadSettings();

    let con = `
        <div id="header">
            <h1 id="logo"></h1>
        </div>
        <div id="charSearchBar">${makeCharSearchBar()}</div>
        <div id="tabs">${makeTabs()}</div>
        <div id="content">${makeContent()}</div>
        <div id="chooser">${makeChooser()}</div>
        <div id="dialog" onclick="closeDialog();">
            <div id="dialogContent" onclick="nothing(event);"></div>
        </div>
    `;

    document.getElementById('wrapper').innerHTML = con;
    animateLogo();
}

function loadSettings() {
    let savedSettings = window.localStorage.getItem('unicode.ninja');
    if(savedSettings) app.settings = JSON.parse(savedSettings);
}

function saveSettings() {
    if(!app.settings.rememberSettings) return;
    window.localStorage.setItem('unicode.ninja', JSON.stringify(app.settings));
}

function testNoGlyph() {
    document.getElementById('content').innerHTML +=`<br><br>
        <div class="charTile" id="testnoglyph">&#x10FFFF;</div><br>
        <textarea id="testtext"></textarea><br>
        <canvas id="testcanvas"></canvas>
    `;

    let ng = document.getElementById('testnoglyph').innerHTML;
    document.getElementById('testtext').innerHTML = ng;
    let ctx = document.getElementById('testcanvas').getContext('2d');
    ctx.font = "120px Arial";
    ctx.fillText(ng, 0, 120);
}

/*
    Range and Character data
*/

function getRange(rid) {
    // if(!unicodeBlocks[rid]) console.warn(`Unknown range: ${rid}`);
    return unicodeBlocks[rid];
}

function getRangeForChar(hex) {
    hex = parseInt(hex, 16);
    for(let r in unicodeBlocks) {
        if(unicodeBlocks.hasOwnProperty(r)) {
            if(hex >= unicodeBlocks[r].begin && hex <= unicodeBlocks[r].end)
                return unicodeBlocks[r];
    }}

    return false;
}

function getDataForChar(hex) {
    hex = ''+hex;
}

function isRangeSelected(rid) {
    return app.settings.selectedRanges.includes(rid);
}

function selectRange(rid) {
    // if(typeof rid === 'string') rid = [rid];
    rid = rid.split('_');
    
    rid.forEach(id => {
        if(!isRangeSelected(id)) app.settings.selectedRanges.push(id);
    });

    sortSelectedRanges();
    saveSettings();
}

function deselectRange(rid) {
    // if(typeof rid === 'string') rid = [rid];
    rid = rid.split('_');

    rid.forEach(id => {
        let i = app.settings.selectedRanges.indexOf(id);
        if(i > -1) app.settings.selectedRanges.splice(i, 1);
    });

    sortSelectedRanges();
    saveSettings();
}

function deselectAllRanges() {
    app.settings.selectedRanges = [];
    redraw();
    saveSettings();
}

function sortSelectedRanges() {
    app.settings.selectedRanges.sort(function (a, b) {
        return parseInt(a.substr(2, 4), 16) - parseInt(b.substr(2, 4), 16);
    });        
}


/*
    Making UI Content
*/

function redraw(onlyContent) {
    if(app.redrawTimeout) clearTimeout(app.redrawTimeout);

    app.redrawTimeout = setTimeout(function () {
        !onlyContent? document.getElementById('tabs').innerHTML = makeTabs() : false;
        !onlyContent? document.getElementById('chooser').innerHTML = makeChooser() : false;
        document.getElementById('content').innerHTML = makeContent();
        
        if(app.focusID){
            let elem = document.getElementById(app.focusID);
            let value = elem.value;
            elem.focus();
            elem.value = '';
            elem.value = value;
        }        
    }, 10);
}

function appFocus(id) {
    app.focusID = id;
    // console.log(`Focused on ${app.focusID}`);
}

function openSettingsDialog() {
    openDialog(`
        <h2>Settings</h2>
        <div class="twoColumn">
            <span class="key">${nbsp('Remember app settings:')}</span>
            <span class="value">
                <input 
                    type="checkbox" 
                    ${app.settings.rememberSettings? 'checked' : ''} 
                    onchange="updateSetting('rememberSettings', this.checked);"
                />
            </span>
        
            <span class="key">${nbsp('Generic character tile font family:')}</span>
            <span class="value">
                <select onchange="updateSetting('genericFontFamily', this.value);" style="width: 200px;">
                    <option value="serif">serif</option>
                    <option value="sans-serif">sans-serif</option>
                    <option value="monospace">monospace</option>
                    <option value="system-ui">system-ui</option>
                    <option value="cursive">cursive</option>
                    <option value="fantasy">fantasy</option>
                </select>
            </span>

            <span class="key">${nbsp('Maximum search results:')}</span>
            <span class="value">
                <input type="number" value="${app.settings.maxSearchResults}" onchange="updateSetting('maxSearchResults', this.value);"/>
            </span>

        </div>
    `);
}

function updateSetting(key, value) {
    // console.log(`Setting ${key} to ${value}`);
    app.settings[key] = value;

    if(key === 'genericFontFamily') {
        app.rangeCache = [];
        redraw(true);
    } if(key === 'rememberSettings' && !value) {
        window.localStorage.removeItem('unicode.ninja');
        window.localStorage.clear();
        // console.log('cleared local storage');
    }

    saveSettings();
}

function openInfoDialog() {
    openDialog(`
        <h2>unicode.ninja</h2>
        A tool to help explore the Unicode® Basic Multilingual Plane <pre>0000-ffff</pre>. 
        Unicode is a registered trademark of Unicode, Inc.  More information can be found at 
        <a href="https://www.unicode.org/" target="_new">unicode.org</a>.

        <br><br>

        <h3>Created by Matt LaGrandeur</h3>
        Questions or comments? Email <a href="mailto:matt@mattlag.com">matt@mattlag.com</a>. 
        This app is an open source project - more information about the project can be found 
        on the <a href="https://github.com/mattlag/UnicodeNinja" target="_new">unicode.ninja GitHub page</a>.
        
        <br><br>

        <h3>App Information</h3>
        <div class="twoColumn">
            <span class="key light">${nbsp('App version:')}</span>
            <span class="value">${app.version}</span>
            
            <span class="key light">${nbsp('App updated on:')}</span>
            <span class="value">${new Date(app.releaseDate).toLocaleDateString()}</span>
            
            <span class="key light">${nbsp('Unicode data version:')}</span>
            <span class="value">v11.0.0 - 2018 June 5th</span>
        </div>
    `);
}

function openDialog(content) {
    document.getElementById('dialogContent').innerHTML = makeCloseButton('closeDialog();') + content;
    document.getElementById('dialog').style.display = 'block';
    window.setTimeout(function () {
        document.getElementById('dialog').style.opacity = '1';
        document.getElementById('dialogContent').style.opacity = '1';
    }, 10);
}

function nothing(event) {
    // console.log(event);
    event.stopPropagation();
}

function makeCloseButton(func) {
    return `<button onclick="${func}" class="actionButton" title="Close">⨉</button>`;
}

function closeDialog() {
    document.getElementById('dialogContent').style.opacity = '0';

    window.setTimeout(function () {
        document.getElementById('dialog').style.opacity = '0';

        window.setTimeout(function () {
            document.getElementById('dialog').style.display = 'none';
            document.getElementById('dialogContent').innerHTML = '';
        }, 150);

    }, 350);
}

function animateLogo() {
    let delta = 0;
    let delay = 50;

    // let fancy = {
    //     car: 'unicode.ninja'.split(''),
    //     jay: ['j', 'ĵ', 'ǰ', 'ɉ'],
    //     sub: ['̥', '̪', '͈', '̬', '̯', '͙', '̭', '', '̺', '͓', '̮', '͈', '͚']
    // };

    let fancy = {
        car: 'unicode.ninja'.split(''),
        jay: ['j', 'ĵ', 'ǰ', 'ɉ'],
        sub: ['̥', '̪', '͈', '̬', '̯', '͙', '̭', '', '̺', '͓', '̮', '͈', '͚', '','','','','','','','','','','','','',]
    };

    function makeLogo(delta) {
        let mod = fancy.car.length;
        re = '';
    
        for(let c=0; c<mod; c++) {
            if(c === 7) {
                re += '.';
            
            } else if (c === 11) {
                re += fancy.jay[(c+delta) % fancy.jay.length];
            
            } else {
                re += fancy.car[c];
                re += fancy.sub[(c+delta) % fancy.sub.length];
            }
        }
    
        return re;
    }

    function updateLogo() {
        var logo = makeLogo(delta);
        document.getElementById('logo').innerHTML = logo;
        document.title = logo;
        if(delta < fancy.car.length) {
            delta++;
            delay *= 1.05;
            window.setTimeout(updateLogo, delay);
        }
    }
    
    updateLogo();
}


/*
    Helper Functions
*/

function decToHex(d) { 
    let dr = Number(d).toString(16);
    while(dr.length < 4) { dr = '0'+dr; }
    return '0x' + dr.toUpperCase();
}

function getUnicodeName(c) {
    if(c.charAt(0) === '0'){
        return fullUnicodeNameList[c] || '{{no name found}}';
    } else {
        return c;
    }
}

function nbsp(text) {
    text = text.replace(/ /gi, '&nbsp;'); // Non-breaking space
    text = text.replace(/-/gi, '&#8209;'); // Non-breaking hyphen
    return text;
}

function getShipDate(){
    let time = '' + (new Date().getTime());
    let prefix = parseInt(time.substr(0, 5)) * 100000000;
    let day = (parseInt(time.charAt(5)) + 1) * 10000000;
    return prefix + day;
}

function findLongestName() {
    let max = 0;
    let result = [];
    let currName = '';

    // console.time('name');
    for(let point in fullUnicodeNameList) {
        if(fullUnicodeNameList.hasOwnProperty(point)) {
            currName = fullUnicodeNameList[point];
            if(!result[currName.length]) result[currName.length] = 1;
            else result[currName.length]++

            // if(currName.length > max) {
            //     max = currName.length;
            //     result.push({length: max, char: point, name: currName});
            // }
        }
    }
    // console.timeEnd('name');

    return result;
}