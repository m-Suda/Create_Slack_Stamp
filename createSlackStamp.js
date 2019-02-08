const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPadMiniLandscape = devices['iPad Mini landscape'];
const fetch = require('node-fetch');
const fs = require('fs');

const TARGET_IMAGE = /^https:\/\/emoji-gen\.ninja\/emoji\?align=center&back_color=FFFFFF00&color=000000FF&font=rounded-x-mplus-1p-black.*$/;
const SAVE_IMAGE_PATH = __dirname + '/screenshot/emoji';

// const CREATE_STR = process.env.STR;
// if (typeof CREATE_STR === 'undefined') {
//     console.log('文字が指定されていません。');
//     return;
// }

puppeteer.launch({
    headless: false,
    args: [
        '--window-size=1024,768'
    ],
    slowMo: 200
}).then(async browser => {

    const page = await browser.newPage();
    await page.emulate(iPadMiniLandscape);
    await page.goto('https://emoji-gen.ninja/#!/');

    // 文字画像生成
    await page.$eval('body > div > div.v-cloak.eg-emoji > div.v-cloak.eg-generator > div.parameters > div.parameter.text > textarea',
        input => {
            // 値を入れた後にフォーカスを当てないとだめだった
            input.value = 'てすと';
            input.focus();
        });
    await page.click('body > div > div.v-cloak.eg-emoji > div.v-cloak.eg-generator > div.parameters > div.parameter.font > ul > li:nth-child(3)');
    await page.$eval('body > div > div.v-cloak.eg-emoji > div.v-cloak.eg-generator > div.parameters > div.parameter.color > div.pickers > div:nth-child(1) > div > div.vue-color__chrome__chrome-body > div.vue-color__chrome__fields-wrap > div:nth-child(1) > div > div > input',
        input => {
            // 値を入れた後にフォーカスを当てないとだめだった
            input.value = '#000000';
            input.focus();
        });
    await page.click('body > div > div.v-cloak.eg-emoji > div.v-cloak.eg-generator > div.buttons > button');

    // 画像保存
    await page.waitForSelector('body > div > div.v-cloak.eg-emoji > div.v-cloak.eg-result.expand-transition > div.preview > div > div.image > img');
    const res = await page._client.send('Page.getResourceTree');
    let images = [];
    res.frameTree.resources.forEach(element => {
        if (element.url.match(TARGET_IMAGE)) {
            images.push(element.url);
            console.log(element.url);
        }
    });
    try {
        images.forEach(async url => {
            const response = await fetch(url);
            let buffer = await response.buffer();
            const filename = 'stamp' + '.png';
            await fs.writeFileSync(`${SAVE_IMAGE_PATH}/${filename}`, buffer);
            console.log('保存に成功しました。');
        });
    } catch (e) {
        console.error(e);
    }

    await browser.close();

});
