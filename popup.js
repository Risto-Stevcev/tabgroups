document.addEventListener('DOMContentLoaded', function() {
  /* * * * * *
   * Classes *
   * * * * * */

  function TabItem(id, title, iconUrl) {
    if (typeof id      !== 'string' || 
        typeof title   !== 'string' || 
        typeof iconUrl !== 'string')
     throw new TypeError('TabItem expects a signature of ' + 
                         '(Number id, String title, String iconUrl)');
   this.id = id;
   this.title = title;
   this.iconUrl = iconUrl;
  }


  /* * * * * * *
   * Functions *
   * * * * * * */

  function tabElement(tabItem) {
    //if (!(tabItem instanceof TabItem))
    //  throw new TypeError('Function expects a TabItem object');
    var tabElem = document.createElement('li');
    tabElem.setAttribute('id', tabItem.id);
    tabElem.setAttribute('class', 'tab');
    tabElem.setAttribute('draggable', 'true');
    tabElem.addEventListener('dragstart', getId);
    tabElem.innerHTML = "<img src='" + tabItem.iconUrl + "' class='icon'/>" + 
                        tabItem.title;
    return tabElem;
  }

  function getTabItem(tabId, tabType) {
    var tabElem = document.getElementById(tabId);
    return new TabItem((tabType || '') + tabId.replace(/[A-Za-z]*/g, ''), 
                       tabElem.innerText, tabElem.firstChild.src);
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  function getId(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
  }

  function addTabToStorage(id, callback) {
    var selectedGroup = document.getElementById('menu').selectedOptions[0].innerText;
    chrome.storage.sync.get(selectedGroup, function(item) {
      var tabId = id.replace(/[A-Za-z]*/g, ''); 

      if (item[selectedGroup])
        item[selectedGroup][tabId] = getTabItem(id);
      else {
        item = {};
        item[selectedGroup] = {};
        item[selectedGroup][tabId] = getTabItem(id);
      }

      chrome.storage.sync.set(item, callback); 
    });
  }

  function removeTabFromStorage(id, callback) {
    var selectedGroup = document.getElementById('menu').selectedOptions[0].innerText;
    chrome.storage.sync.get(selectedGroup, function(item) {
        var tabId = id.replace(/[A-Za-z]*/g, ''); 

        if (item[selectedGroup] && item[selectedGroup][tabId])
          delete item[selectedGroup][tabId];
        else if (!item[selectedGroup]) {
          item = {};
          item[selectedGroup] = {};
        }
        
        chrome.storage.sync.set(item, callback);
    });
  }

  function addTab(event) {
    event.preventDefault();
    var id = event.dataTransfer.getData('text/plain');

    if (id.slice(0,4) === 'base') {
      addTabToStorage(id, function() {
        document.getElementById('tablist').appendChild(tabElement(getTabItem(id, 'group')));
      });
    }
  }

  function removeTab(event) {
    event.preventDefault();
    var id = event.dataTransfer.getData('text/plain');

    removeTabFromStorage(id, function() {
      var element = document.getElementById(id);
      element.parentNode.removeChild(element);
    });
  }

  function addBaseElements() {
    var baseList = document.getElementById('baselist');
    baseList.innerHTML = '';  // Remove tab elements

    /* Add tab elements if baseList window is set and exists */
    chrome.storage.sync.get('baseList', function(item) {
      if (item.baseList) {
        try {
          chrome.windows.get(item.baseList, {populate: true}, function(_window_) {
            _window_.tabs.forEach(function(tab) {
              var tabItem = new TabItem('base'+tab.id, tab.title, 
                tab.favIconUrl || 
                (tab.url.indexOf('google.com') > -1 ? 
                   'http://www.google.com/favicon.ico'
                 : 'chrome://favicon/' + tab.url)
              );
              baseList.appendChild(tabElement(tabItem));
            });
          }); 
        }
        catch (e) { chrome.storage.sync.clear(); }
      }
    });
  }

  function disableBaseLink() {
    var newElement = document.createElement('span');
    var baseLink = document.getElementById('baselink');
    newElement.innerHTML = baseLink.innerHTML;
    baseLink.parentNode.replaceChild(newElement, baseLink);
  }

  function addGroupTabs(tabGroup) {
    chrome.storage.sync.get(tabGroup, function(item) {
      if (item[tabGroup]) {
        var tabList = document.getElementById('tablist');
        tabList.innerHTML = '';

        Object.keys(item[tabGroup]).forEach(function(key) {
          var tabItem = item[tabGroup][key];
          tabList.appendChild( tabElement(tabItem) );
        });
      }
      else {
        var item = {};
        item[tabGroup] = {};
        chrome.storage.sync.set(item);
      }
    });
  }


  /* * * * * * * * * * *
   * Add base elements *
   * * * * * * * * * * */

  chrome.storage.sync.get('baseList', function(item) {
    if (item.baseList)
      addBaseElements();
    else
      (function addNoBaseSetInfo() {
        var listItem = document.createElement('li');
        listItem.innerHTML = 'No base set.';
        document.getElementById('baselist').appendChild(listItem);
      })();
  });


  /* * * * * * *
   * Listeners *
   * * * * * * */

  /* Menu listener */
  document.getElementById('menu').addEventListener('change', function() {
    var group = event.target.selectedOptions[0].innerHTML;

    chrome.storage.sync.get(group, function(item) {
      if (item[group])
        addGroupTabs(group);
      else {
        var item = {};
        item[group] = {};
        chrome.storage.sync.set(item);
      }
    });
  });


  /* Icon listeners  */
  var dropArea = document.getElementById('droparea');
  dropArea.addEventListener('dragover', allowDrop, false);
  dropArea.addEventListener('drop', addTab, false);

  var baseLink = document.getElementById('baselink');
  baseLink.addEventListener('click', function(event) {
    chrome.windows.getCurrent(function(_window_) {
      chrome.storage.sync.set({'baseList': _window_.id}, function() {
        addBaseElements();
      });
    });
    disableBaseLink();
  });

  var loadIcon = document.getElementById('loadgroup');
  loadIcon.addEventListener('click', function(event) {
  });

  var removeIcon = document.getElementById('removegroup');
  removeIcon.addEventListener('click', function(event) {
  });

  var addIcon = document.getElementById('addgroup');
  addIcon.addEventListener('click', function(event) {
  });

  var trashIcon = document.getElementById('trash'); 
  trashIcon.addEventListener('dragover', allowDrop, false);
  trashIcon.addEventListener('drop', removeTab, false);


  /* * * * * * * *
   * Initialize  *
   * * * * * * * */

  chrome.storage.sync.get('baseList', function(item) {
    if (item.baseList) {
      chrome.windows.getCurrent(function(_window_) {
        if (item.baseList === _window_.id)
          disableBaseLink();
      });
    }
  });

  addGroupTabs('Default');
});
