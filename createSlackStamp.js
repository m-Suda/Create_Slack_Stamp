const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPadMiniLandscape = devices['iPad Mini landscape'];
const fetch = require('node-fetch');
const fs = require('fs');
const {DOM} = require('./dom/dom');

const TARGET_IMAGE = /^https:\/\/emoji-gen\.ninja\/emoji\?align=center&back_color=FFFFFF00&color=000000FF&font=rounded-x-mplus-1p-black.*$/;
const SAVE_IMAGE_PATH = __dirname + '/screenshot/emoji';

const CREATE_STR = process.env.STR;
if (typeof CREATE_STR === 'undefined') {
    console.log('文字が指定されていません。');
    return;
}

// ここのコメントを外すと実際にChromeが起動して自動で動きます。
puppeteer.launch({
    // headless: false,
    // args: [
    //     '--window-size=1024,768'
    // ],
}).then(async browser => {

    const page = await browser.newPage();
    await page.emulate(iPadMiniLandscape);
    await page.goto('https://emoji-gen.ninja/#!/');

    // 文字画像生成
    await page.$eval(DOM.TEXT, input => input.value = '');
    await page.type(DOM.TEXT, CREATE_STR); // $evalだと値が取れなかった。
    await page.focus(DOM.TEXT);
    await page.click(DOM.FONT_BUTTON_ROUNDED);
    await page.$eval(DOM.COLOR, input => {
        input.value = '#000000';
        input.focus();
    });
    await page.click(DOM.CREATE_BUTTON);

    // 画像保存
    await page.waitForSelector(DOM.CREATE_IMAGE);
    const res = await page._client.send('Page.getResourceTree');
    let images = [];
    res.frameTree.resources.forEach(element => {
        if (element.url.match(TARGET_IMAGE)) {
            images.push(element.url);
            console.log(element.url);
        }
    });
    try {
        images.forEach(async (url, index) => {
            const response = await fetch(url);
            let buffer = await response.buffer();
            const filename = `stamp${index}.png`;
            await fs.writeFileSync(`${SAVE_IMAGE_PATH}/${filename}`, buffer);
            console.log('保存に成功しました。');
        });
    } catch (e) {
        console.error(e);
    }

    await browser.close();
});
