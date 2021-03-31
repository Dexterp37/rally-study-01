import { Rally, runStates } from "@mozilla/rally";
import { onPageData, stopMeasurement } from "./attention-reporter";

function openPage() {
    browser.runtime.openOptionsPage().catch(e => {
      console.error(`Study Add-On - Unable to open the control panel`, e);
    });
  }
  
const rally = new Rally();

function collectEventDataAndSubmit() {
  // note: onPageData calls startMeasurement.
  onPageData.addListener(async (data) => {
    if (__ENABLE_DEVELOPER_MODE__) {
      console.debug('RS01.event', data);
    }
    // though we collect the data as two different event types using Web Science,
    // we send the payload using one schema, "RS01.event".
    // Once https://github.com/mozilla-rally/web-science/issues/33 is resolved,
    // we will change the collection schema (but keep this pipeline schema the same).
    rally.sendPing("RS01.event", data);
  }, {
      matchPatterns: ["<all_urls>"],
      privateWindows: false
  });
}

rally.initialize(
  // A sample key id used for encrypting data.
  "sample-invalid-key-id",
  // A sample *valid* JWK object for the encryption.
  {
    "kty":"EC",
    "crv":"P-256",
    "x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
    "y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    "kid":"Public key used in JWS spec Appendix A.3 example"
  },
  // The following constant is automatically provided by
  // the build system.
  __ENABLE_DEVELOPER_MODE__,
  (newState) => {
    if (newState === runStates.RUNNING) {
      // if the study is running but wasn't previously, let's re-initiate the onPageData listener.
      console.debug("~~~ RS01 running ~~~");
      collectEventDataAndSubmit();
    } else {
      console.debug("~~~ RS01 not running ~~~");
      // stop the measurement here.
      stopMeasurement();
    }
  }
).then(() => {
  // Initialize the event data collection and submission.
  console.debug("~~~ RS01 running ~~~");
  collectEventDataAndSubmit();
  browser.browserAction.onClicked.addListener(openPage);
}, reject => {
  // Do not start the study in this case. Something
  // went wrong.
});