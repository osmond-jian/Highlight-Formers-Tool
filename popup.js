let highlightFormer = document.getElementById("highlightFormers");
let companyName = document.getElementById("companyName");
let years = document.getElementById("years");


//This remembers your previous search so you don't have to type it out every single time you open the popup. It stores the result in chrome.storage.sync.
window.onload = function rememberNameAndYear () {
  chrome.storage.sync.get(["companyNameArray", "formerYears"], async (result) => {
    if ((result.companyNameArray !== "" || result.companyNameArray !== null) && (result.formerYears !== "" || result.fomerYears !== null)){
    companyName.value = result.companyNameArray;
    years.value = result.formerYears;
    } else {
      console.log ('no previous session information')
    }
  });
}

//This adds an event listener to the popup button element. It saves the search in chrome.storage, and injects the scrollToBottom script.
highlightFormer.addEventListener("click", async () => {
  
  let [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  let tabId = tab.id;

  //store value in memory - should we use local, sync, or session?
  await chrome.storage.sync.set({
    "companyNameArray":companyName.value,
    "formerYears":years.options[years.selectedIndex].text,
  }).then(() => {
    console.log("Company is set to " + companyName.value);
    console.log("Years is set to " + years.options[years.selectedIndex].text)
  })

  await chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      function: scrollToBottom,
    },
    () => {
      // Script injected successfully
      console.log("Injected scrollToBottom script");
    }
  );    
});

//This listens to an event message from the scrollToBottom script, letting the plugin know that the linkedin page has scrolled many times, ideally prompting the html to render. In response, it injects the highlightsFormers script.
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    let tabs = await chrome.tabs.query({active:true, currentWindow:true});
    let tabId = tabs[0].id;

    console.log(sender.tab?
      "from a content script:" + sender.tab.url :
      "from the extension");
    if (request.scroll === "finished")
      sendResponse({farewell:"goodbye"});
      //inject highlightformer script
      
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          function: highlightFormers,
          args: [companyName.value, years.value],
        },
        () => {
      // Script injected successfully
          console.log("Injected highlightFormers script");
        }
      );
    }
  )

//This function contains two async functions that will happen sequentially. Note that a live nodelist is obtained with .getElementsByClassName() method.
async function highlightFormers(companyName, formerYears){

  let profiles = document.body.getElementsByClassName('profile-list__border-bottom');
  console.log(profiles);
//This function clicks on the 'see more' button to open up the html information for employment history. It uses a 'for...of' loop to cycle through a nodelist obtained with a .querySelectorAll method.
  async function clickSeeMore(){
    for (const element of profiles) {
      let attempts = 0;
      let seeMoreButton = element.querySelector('button.expandable-list__button');
      // console.log(seeMoreButton);
    
      while (!seeMoreButton && attempts < 3) {
        console.log('could not find the button, waiting 2 seconds and trying again');
        await new Promise(resolve => setTimeout(resolve, 2000));
        seeMoreButton = element.querySelector('button.expandable-list__button');
        attempts++;
      }
      
      if (seeMoreButton) {
        if (seeMoreButton.getAttribute('aria-expanded') === "false") {
          seeMoreButton.click();
          console.log('click');
        } else {
        console.log('button is already expanded');
        }
      } else {
        console.log('maximum attempts reached, giving up');
      }
    }
  }

//This function checks the employment history of the profile by comparing it to the plugin inputs, turning the background color purple if it is within 4 years.
    async function checkEmploymentHistory (){
      const thisYear = new Date(); //for the getFullYear() method

      for (const element of profiles){
        let workHistory = element.children[0].children[0].children[1].children[0].children[0].children[0].children[0].children[1].children[0].children[1];
        console.log ((workHistory));

        for (let i=0; i < workHistory.children.length; i++){
          console.log(workHistory.children[i].children[0].innerHTML);
          console.log(workHistory.children[i].children[2].innerHTML)
          if (!workHistory.children[i].children[2].children[1]){
            //the span not having a child means that it is probably the 'date - Present'
            continue;
          } else if (
          workHistory.children[i].children[0].innerHTML.includes(companyName) &&
          (thisYear.getFullYear() >= Number(workHistory.children[i].children[2].children[1].innerHTML)) && //jobDate should not be bigger than current year of 2023
          (thisYear.getFullYear()-Number(workHistory.children[i].children[2].children[1].innerHTML)<=Number(formerYears)) //2023 - jobDate <= Years Former
          ) {
            element.style.backgroundColor = "#CBC3E3";
            break;
          } else {
            console.log(workHistory.children[i].children[0].innerHTML.includes(companyName));
            console.log(2023 >= Number(workHistory.children[i].children[2].children[1].innerHTML));
            console.log((2023-Number(workHistory.children[i].children[2].children[1].innerHTML)>=Number(formerYears)));
          }
        }
      }
    }

    await clickSeeMore();
    await checkEmploymentHistory();
    //error handling?
};



// This function scrolls to the bottom of the page to help render the html
function scrollToBottom() {
  // Set the distance to scroll down in each step
  let scrollStep = 1000; // Change this value to adjust the scrolling speed

  // Start at the top of the page
  let currentPosition = 0;

  // Define the scroll function
  function scrollStepFunction() {
    // Scroll down one step
    currentPosition += scrollStep;
    window.scrollTo(0, currentPosition);

    // Check if we've reached the bottom of the page
    if (currentPosition >= document.body.scrollHeight) {
      // If we have, stop scrolling and check for the occlusion element - note that a live nodelist/htmlcollection is used
      clearInterval(scrollInterval);
      let occlusionElement = document.getElementsByClassName('profile-list__occlusion-area');
      if (occlusionElement.length === 0) {
        chrome.runtime.sendMessage({scroll:"finished"});
        console.log('message sent')
      }else{
        // If the element with that clas name exists, scroll back up
        window.scrollTo(0, 0);
        scrollToBottom();
      }
    }
  }

  // Start scrolling down in steps
  let scrollInterval = setInterval(scrollStepFunction, 10); // Change this value to adjust the step size
}