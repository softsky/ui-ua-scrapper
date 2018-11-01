const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const main = require('./index');
const logger = require('./utils/logger');

const { db, collection, username, password } = require('./db-test.json');

const expect = chai.expect;

chai.use(chaiAsPromised);

describe('Puppeteer testing suite', () => {
  let m, mc, b;
  beforeAll(async () => {
    var uri = `mongodb+srv://${username}:${password}@cluster0-l3ior.mongodb.net`;
    m = require('mongodb').MongoClient.connect(uri, {
      ssl: true,
      useNewUrlParser: true })
      .then((client) => mc = client)
    // deleting all documents
      .then(() => mc.db(db).collection(collection).deleteMany({}).then((a, b, c) => logger.info(JSON.stringify({ a, b, c }))))
      .then(() => mc.db(db).collection(collection).count())
      .then((count) =>  expect(count).to.be.equal(0))
      .catch((e) => {
        logger.error(e);
        return true; /* eating exception */
      });

    b = require('puppeteer').launch({
      // headless: false,
      headless: true,
      // args: ['--proxy-server=socks5://127.0.0.1:9050']
      // slowMo: 0
    });

    var ret = Promise.all([m, b]); // waiting for both promises

    m = await m;
    b = await b;

    return ret;
  });


  afterAll(() => {
    return Promise.all([mc?mc.close():Promise.resolve(), b.close()]);
  }, 10000);

  describe('Crawl',  async () => {
    it.skip('Should crawl all domains on google', async () => {
      const companies = await main.crawlGoogleResults('https://www.google.com/search?num=100&q=site%3Aui.ua+%2Binurl%3A%22%2Fcontacts%22', b);

      expect(companies).to.be.an('array');
      expect(companies).to.have.property('length').equal(400);

    }, 3600000);

    it('Should crawl single company', async () => {
      const company =
            await main.crawlCompany('http://dom-maister.ui.ua/', b);

      expect(company).to.be.an('object');
      expect(company).to.have.property('title');
      expect(company).to.have.property('phone');
      expect(company).to.have.property('address');
      expect(company).to.have.property('text');

    }, 10000);

    it('Should not break if crawl 404 page', async() => {
      const c = await main.crawlCompany('http://189641.ui-ua.com', b);
      expect(c).to.be.an('object');
      expect(c).to.have.property('url').equal('189641.ui-ua.com');
      expect(c).to.have.property('response').to.have.property('status').equal(404);
      logger.info(JSON.stringify(c));
    }, 10000);


    it('Should store single crawled company', async () => {
      const company = { 'phone':['0680028429', '0665160332'], 'address':'Оболоня, 49 ', 'banner':'http://dom-maister.ui.ua/Content/images/Company/197736/design/banner.png', 'title':'Домашній майстер у Тернополі та області', 'text':['\n                ', '', '', '', 'інтернет - магазин - майстерня', ' ', '  Ми ремонтуємо, ', 'замовляємо ', 'і продаємо запчастини,', 'сантехнічне та електричне обладнання,', 'встановлюємо та підключаємо ', 'домашню побутову техніку.', ' ', 'Всю необхідну інформацію щодо нашої роботи ', 'можна отримати на цьому сайті. ', '', 'Ми знаходимося на території ринку "Котломонтаж",', 'через дорогу від торгового центру "Vero"', 'з адресою:', 'м.Тернопіль,', 'вул. Оболоня, 49', 'в двоповерховому будинку ', '(зліва коло воріт), ', 'на другому поверсі,', 'перші зліва двері.', 'Приходити бажано лише за попередньою домовленістю.', ' ', 'Контакти:', '"Viber, WhatsApp, Telegram, Messenger" ', '- (068)-00-284-29,', '-  (066)-51-603-32. ', 'E-Mail: dom.maister.72@gmail.com', '', '"Домашній майстер" ще ', 'розвивається і удосконалюється,', 'щоб крокувати в ногу з часом,', 'та надавати можливість в комфортній обстановці ', 'вибирати, ', 'замовляти і купувати ', 'потрібні Вам запчастини та послуги.', ' ', 'На нашому сайті ', 'планується розмістити широкий асортимент: ', 'оригінальних ', 'і універсальних запасних частин, ', 'комплектуючих, ', 'аксесуарів,', 'витратних матеріалів,', 'необхідних для ремонту і обслуговування ', 'найрізноманітнішої побутової техніки,', 'домашнього обладнання, ', 'та послуг з ремонту і встановлення.', '', 'Якщо Ви не знайдете на сайті потрібної Вам запчастини, ', 'зв\'яжіться з нами, ', 'можлива доставка запчастини під замовлення', 'за доступною ціною.', 'Ми завжди раді допомогти Вам.', '', 'Зламалась витяжка,', 'пилосос,', 'хлібопічка ', 'або будь-яка інша побутова техніка? ', ' ', 'Не варто панікувати і поспішати купувати нову. ', ' ', 'Ми постараємося допомогти Вам вирішити цю проблему.  ', 'Забрати запчастини можна в місті Тернополі, ', 'а також ми відправляємо запчастини по Україні.', ' ', 'Розрахуватися можна:', 'готівковою, ', 'на карту “Приватбанку”, ', 'а також "Післяоплата" через пошту.', ' НАШІ ПЕРЕВАГИОсновна мета нашої роботи — це додавати всіх зусиль, для того, щоб Ви безумовно стали нашими постійними замовниками.Ми дорожимо репутацією нашої компанії, надаючи доброчесну і якісну співпрацю, бо розуміємо, що для перспективної та продуктивної роботи потрібно постійно вдосконалюватися, оскільки існує жорстка конкуренція.Ми гарантуємо нове життя Вашій техніці!', '\n            '] };
      return  main.storeCompany(company, m);
    });
  }, 10000);

  it('Should crawl companies in batch', async () => {
    var companies = require('./input.json');

    expect(companies).to.be.an('array');
    expect(companies).to.have.property('length').equal(530);

    companies = await main.crawlCompanies(companies, b, 10);

    expect(companies).to.be.an('array');
    //expect(companies).to.have.property('length').equal(530);
  }, 3600000);

  it.only('Should store companies in batch', async () => {
    var companies = require('./input.json');

//    companies = [companies[0], companies[1]]
    expect(companies).to.be.an('array');
    expect(companies).to.have.property('length').equal(530);

    companies = await main.crawlCompanies(companies, b, 10);

    expect(companies).to.be.an('array');
    expect(companies).to.have.property('length').equal(530);

    var stored = await main.storeCompany(companies, m);

    logger.info(`Stored: ${JSON.stringify(stored)}`);
    expect(stored).to.has.property('insertedCount').to.be.equal(530);
    expect(stored).to.has.property('insertedIds').to.be.an('object');
  }, 3600000);


});
