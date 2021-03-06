import { focusChild, focusMain, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import {
  chatIsVisible,
  clickGoLive,
  goLive,
  prepareToGoLive,
  scheduleStream,
  submit,
  waitForStreamStart,
} from '../../helpers/spectron/streaming';
import { FormMonkey, selectTitle } from '../../helpers/form-monkey';
import { sleep } from '../../helpers/sleep';
import moment = require('moment');

useSpectron();

test('Streaming to a Facebook Page', async t => {
  await logIn(t, 'facebook');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    facebookGame: selectTitle('Fortnite'),
    description: 'SLOBS Test Stream Description',
  });
  t.true(await chatIsVisible(t), 'Chat should be visible');
  t.pass();
});

test('Streaming to a Facebook User`s timeline', async t => {
  await logIn(t, 'facebook', { allowStreamingToFBTimeline: true });
  await goLive(t, {
    title: 'SLOBS Test Stream',
    facebookGame: selectTitle('Fortnite'),
    description: 'SLOBS Test Stream Description',
    destinationType: 'me',
  });
  t.pass();
});

test('Streaming to a Facebook User`s group', async t => {
  await logIn(t, 'facebook', { hasFBGroup: true });
  await goLive(t, {
    title: 'SLOBS Test Stream',
    facebookGame: selectTitle('Fortnite'),
    description: 'SLOBS Test Stream Description',
    destinationType: 'group',
  });
  t.pass();
});

// TODO: delete all the scheduled on the user-pool and enable this test
test.skip('Streaming to the scheduled event on Facebook', async t => {
  await logIn(t, 'facebook', { multistream: false });

  // create event via scheduling form
  const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
  const title = `facebook scheduled stream ${tomorrow}`;
  await scheduleStream(t, tomorrow, {
    title,
    description: 'Facebook Test Stream Description',
  });

  // select event and go live
  await prepareToGoLive(t);
  await clickGoLive(t);
  const form = new FormMonkey(t);
  await form.fill({
    fbEvent: selectTitle(title),
  });
  await submit(t);
  await waitForStreamStart(t);
  t.pass();
});

// TODO: refresh tookens on user-pool side
test.skip('Schedule stream to facebook', async t => {
  // login into the account:
  await logIn(t, 'facebook', { multistream: false });
  const app = t.context.app;

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button .icon-date');

  await focusChild(t);
  const formMonkey = new FormMonkey(t);

  // wait fields to be shown
  await app.client.waitForVisible('[data-name=title]');

  // set the date to tomorrow
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // fill streaming data
  await formMonkey.fill({
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
    date: moment(tomorrow).format('MM/DD/YYYY'),
  });

  await app.client.click('button=Done');
  await app.client.waitForVisible('.toast-success', 30000);
  t.pass();
});
