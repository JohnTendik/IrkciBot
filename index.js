require('dotenv').config();

const Snoowrap = require('snoowrap');
const { translateText, isEnglishText } = require('./translate-helper');

let RedditApi;

const markdownMessage = `Merhaba, bir dizeyi çevirmek için yardım istediniz!

Istediginiz cevirim:

> {replace}

Bu botu beğendiyseniz veya herhangi bir sorununuz varsa, lütfen yaratıcı u/jttheit ile iletişime geçin.`;

const init = () => {
  RedditApi = new Snoowrap({
    userAgent: 'IrkciBot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASSWORD
  });

  // Every 10 seconds check the inbox
  setInterval(pollInbox, 10000);
}

const pollInbox = () => {
  console.log('Polling inbox for unread messages..');

  RedditApi.getUnreadMessages().then((res) => {
    if (res.length) {
      res.forEach(item => {
        handleNewInboxItem(item);
      });
    } else {
      console.log('No new messages detected');
    }
  });
};

const shouldTranslate = (text) => {
  const specialCommands = [
    'bura turkiye',
    'yardim',
    'burasi turkiye ulan',
    'turkce konus',
    'turkiye bura'
  ];

  let toCheckText = text.toLowerCase().replace('u/irkcibot', '').trim();

  return specialCommands.includes(toCheckText);
};

const getMentionParent = (parentId) => {
  if (parentId.includes('t3_')) {
    // is submission
    return RedditApi.getSubmission(parentId).fetch().then((response) => {
      if (!response.selftext || response.selftext === '') {
        return response.title;
      } else {
        return response.selftext;
      }
    });
  } else if (parentId.includes('t1_')) {
    // is comment
    return RedditApi.getComment(parentId).fetch().then((response) => response.body);
  }

  return false;
};

const ignoreMessage = (item) => {
  console.log(`Ignoring message: ${item.id} from: ${item.author.name}`);
  RedditApi.markMessagesAsRead([`t1_${item.id}`]).then(() => {
    console.log('Message marked as read. Will be ignored for next poll');
  });
};

const handleNewInboxItem = async (item) => {
  // return if not a mention & mark read so ignored for next poll
  if (!item.was_comment) {
    console.log(`Ignoring message: ${item.id} from: ${item.author.name}`);
    RedditApi.markMessagesAsRead([item.id]).then(() => {
      console.log('Message marked as read. Will be ignored for next poll');
    });
    return;
  }

  // return and ignore if the mention does not have the special keywords
  if (!shouldTranslate(item.body)) {
    ignoreMessage(item);
    return;
  }

  // Get parent comment
  const parentContent = await getMentionParent(item.parent_id);
  
  if (!parentContent) {
    return;
  }

  // check to ensure text is in english
  isEnglishText(parentContent).then((response) => {
    if (response.result.languages[0].language === 'en') { 
      // translate content
      translateText(parentContent).then((response) => {
        const translatedText = response.result.translations[0].translation;
        
        // reply to the comment / thread
        item.reply(markdownMessage.replace('{replace}', translatedText));
        
        // ignore once replied to.
        ignoreMessage(item);
      }).catch((err) => {
        console.log(err);
      });
    }
  }).catch((err) => {
    console.log(err);
  });
};

init();