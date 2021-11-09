// Wait for login and get the welcome message
import { Builder, By, until } from 'selenium-webdriver'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import assert from 'assert';
import readline from 'readline';
import fs from 'fs';
import request from 'request';

var download = (uri, filename, callback) => {
  return request.head(uri, (err, res, body) => {
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);

    return request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};


const createDriver = async () => {
  const chrome = require('selenium-webdriver/chrome');
  const options = new chrome.Options();

  options.addArguments('--disable-dev-shm-usage')
  options.addArguments('--no-sandbox')

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build()
};

const findElementSafe = async (webElementArray, xpath) => {
  return (await webElementArray.findElements(By.xpath(xpath)))[0];
}


const startUp = async () => {
  let driver = await createDriver();

  await driver.get('https://www.mtgpics.com/card?ref=alp001')

  return driver; 
};

async function processCard(driver, code) {
  let cardInfo = {};

  await driver.navigate().to('https://www.mtgpics.com/card?ref=alp'+code)

  let nameElement = await driver.findElement(By.className('Card20'));
  let typeElement = await driver.findElement(By.className('CardG16'));
  let descElement = await driver.findElement(By.id('EngShort'));
  let powerUpElement = await driver.findElements(By.xpath('//div[@style="height:25px;float:right;"]/img'))
  let rarityElement = await driver.findElement(By.xpath('//tbody/tr/td[@align="center"]/img[@border="0"]'))

  let powerUpsList = [];

  for (let index = 0; index < powerUpElement.length; index++) {
    let powerUpCurrentElement = powerUpElement[index];
    powerUpCurrentElement = await powerUpCurrentElement.getAttribute('src');
    powerUpCurrentElement = powerUpCurrentElement.slice(39,40);
    powerUpsList.push(powerUpCurrentElement);
  }

  rarityElement = await rarityElement.getAttribute('src');
  rarityElement = rarityElement.slice(42,44);

  let rarity = 'unknown';

  switch (rarityElement) {
    case '10':
      rarity = 'rare';
      break;
    case '20':
      rarity = 'uncommon';
      break;
    case '30':
      rarity = 'common';
      break;
  }
  

  cardInfo.code = code;
  cardInfo.name = await nameElement.getText();
  cardInfo.type = await typeElement.getText();
  cardInfo.description = await descElement.getText();
  cardInfo.powerUps = powerUpsList;
  cardInfo.rarity = rarity;
  cardInfo.img = "https://www.mtgpics.com/pics/big/alp/"+code+".jpg"

  download(cardInfo.img, 'images/'+code+'.jpg', () => {
    console.log('done downloading "'+code+'.jpg"');
  });

  // console.log(cardInfo);
  return cardInfo;
}

let cardTransformer = (card) => {
  let pu = '';
  for (let index = 0; index < card.powerUps.length; index++) {
    pu += card.powerUps[index]+'-';
  }
  pu = pu.slice(0, -1);
  return `${card.code}, ${card.name}, ${card.rarity}, ${pu}, ${card.type}, ${card.description}`;
}

async function start () {
  console.log('driver getting ready!')
  let driver = await startUp();
  console.log('driver ready!')

  let cards = '' 

  for (let index = 1; index < 303; index++) {
    if(index == 34 || index == 94 || 
       index == 132 || index == 172 || 
       index == 198 || index == 251 || 
       index == 277){
      continue;
    }
    let num = index.toString();
    while (num.length < 3) num = "0" + num;
    let newCard = await processCard(driver, num);
    // console.log(newCard);
    cards += cardTransformer(newCard)+'\n';
  }

  console.log(cards);

  fs.writeFile('info.txt', cards, err => {
    if (err) {
      console.log('error writing to file');
      return
    }
  });

  // const rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  // });
  // let readLineFunction = () => {
  //   rl.question("Enter Card Code ? ('no' to exit) ", async (answer) => {
  //     if (answer == 'no') {
  //       driver.quit();
  //       rl.close();
  //     }else {
  //       let card = await processCard(driver, answer);
  //       console.log(card);
  //       readLineFunction();
  //     }
  //   });
  // }
  // readLineFunction();

}

start();