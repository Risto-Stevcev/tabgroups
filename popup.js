document.addEventListener('DOMContentLoaded', function() {
  /* * * * * *
   * Classes *
   * * * * * */

  function TabItem(id, title, url, iconUrl) {
    if (typeof id      !== 'string' || 
        typeof title   !== 'string' || 
        typeof url     !== 'string' ||
        typeof iconUrl !== 'string')
     throw new TypeError('TabItem expects a signature of ' + 
                         '(Number id, String title, String iconUrl)');
   this.id = id;
   this.title = title;
   this.url = url;
   this.iconUrl = iconUrl;
  }


  /* * * * * * *
   * Functions *
   * * * * * * */

  function tabElement(tabItem) {
    var tabElem = document.createElement('li');
    tabElem.setAttribute('id', tabItem.id);
    tabElem.setAttribute('class', 'tab');
    tabElem.setAttribute('draggable', 'true');
    tabElem.setAttribute('title', tabItem.url);
    tabElem.addEventListener('dragstart', getId);
    tabElem.innerHTML = "<img src='" + tabItem.iconUrl + "' class='icon'/>" + 
                        tabItem.title;
    return tabElem;
  }

  function getTabItem(tabId, tabType) {
    var tabElem = document.getElementById(tabId);
    return new TabItem((tabType || '') + tabId.replace(/[A-Za-z]*/g, ''), 
                       tabElem.innerText, tabElem.title, tabElem.firstChild.src);
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  function getId(event) {
    Array.prototype.forEach.call(event.target.parentNode.children, function(element, index) {
      if (element === event.target) {
        var transferItem = { id: event.target.id, index: index };
        event.dataTransfer.setData('text/plain', JSON.stringify(transferItem));
      }
    });
  }

  function addTabToStorage(id, callback) {
    var selectedGroup = document.getElementById('menu').selectedOptions[0].innerText;
    chrome.storage.sync.get(selectedGroup, function(item) {
      var tabId = id.replace(/[A-Za-z]*/g, ''); 

      if (item[selectedGroup] && item[selectedGroup].length > 0)
        item[selectedGroup].push( getTabItem(id) );
      else {
        item = {};
        item[selectedGroup] = [];
        item[selectedGroup].push( getTabItem(id) );
      }

      chrome.storage.sync.set(item, callback); 
    });
  }

  function removeTabFromStorage(id, callback) {
    var selectedGroup = document.getElementById('menu').selectedOptions[0].innerText;
    chrome.storage.sync.get(selectedGroup, function(item) {
        var tabId = id.replace(/[A-Za-z]*/g, ''); 

        if (item[selectedGroup]) {
          for(var i = 0; i < item[selectedGroup].length; i++)
            if (item[selectedGroup][i].id == tabId)
              item[selectedGroup].splice(i, 1);
        }
        else if (!item[selectedGroup]) {
          item = {};
          item[selectedGroup] = [];
        }
        
        chrome.storage.sync.set(item, callback);
    });
  }

  function addTab(event) {
    event.preventDefault();
    var transferItem = JSON.parse(event.dataTransfer.getData('text/plain'));
    var id = transferItem.id;

    if (id.slice(0,4) === 'base') {
      addTabToStorage(id, function() {
        document.getElementById('tablist').appendChild(tabElement(getTabItem(id, 'group')));
      });
    }
  }

  function removeTab(event) {
    event.preventDefault();
    var transferItem = JSON.parse(event.dataTransfer.getData('text/plain'));
    var id = transferItem.id;

    removeTabFromStorage(id, function() {
      var tabList = document.getElementById('tablist');
      tabList.removeChild(tabList.children[transferItem.index]);
    });
  }

  function addBaseElements() {
    var baseList = document.getElementById('baselist');
    while (baseList.hasChildNodes())
      baseList.removeChild(baseList.lastChild);

    chrome.storage.sync.get('baseList', function(item) {
      if (item.baseList) {
        try {
          chrome.windows.get(item.baseList, {populate: true}, function(_window_) {
            _window_.tabs.forEach(function(tab) {
              var tabItem = new TabItem('base'+tab.id, tab.title, tab.url, 
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
  var menu = document.getElementById('menu');
  menu.addEventListener('change', function(event) {
    var group = event.target.selectedOptions[0].innerHTML;

    chrome.storage.sync.get(group, function(item) {
      if (item[group])
        addGroupTabs(group);
      else {
        var item = {};
        item[group] = {};
        chrome.storage.sync.set(item);
        document.getElementById('tablist').innerHTML = '';
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
    var menu = document.getElementById('menu');
    var groupName = menu.selectedOptions[0].innerText;
    chrome.storage.sync.get(groupName, function(item) {
      if (item[groupName]) {
        /*(function clearTabs() {
          chrome.windows.getCurrent({ populate: true }, function(currentWindow) {
            currentWindow.tabs.forEach(function(tab, index) {
              if (index === currentWindow.tabs.length - 1)
                chrome.tabs.create({ url: 'chrome://newtab' });
              chrome.tabs.remove(tab.id);
            });
          });
        })();*/

        /* Load tabs */
        var tabs = Object.keys(item[groupName]);
        tabs.forEach(function(tab) {
          chrome.tabs.create({ url: item[groupName][tab].url });
        });
      }
    });
  });

  var removeIcon = document.getElementById('removegroup');
  removeIcon.addEventListener('click', function(event) {
    var menu = document.getElementById('menu');
    var groupName = menu.selectedOptions[0].innerText;
    if (groupName === 'Default') 
      return;
    var confirmRemove = confirm('Remove group ' + groupName + '?');

    if (confirmRemove) {
      var defaultIndex;
      Array.prototype.forEach.call(menu.children, function(group, index) {
        if (group.innerHTML === 'Default')
          defaultIndex = index;
        else if (group.innerHTML === groupName)
          menu.removeChild(group);
      });

      chrome.storage.sync.remove(groupName, function() {
        if (defaultIndex !== undefined) {
          menu.selectedIndex = defaultIndex;
          menu.dispatchEvent(new Event('change'));
        }
      });
    }
  });

  var addIcon = document.getElementById('addgroup');
  addIcon.addEventListener('click', function(event) {
    var groupName = prompt('Enter group name:');

    if (groupName) {
      var menu = document.getElementById('menu');
      var newGroup = document.createElement('option');
      newGroup.innerHTML = groupName;
      menu.appendChild(newGroup);

      menu.selectedIndex = menu.children.length - 1;
      menu.dispatchEvent(new Event('change'));
    }
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

  chrome.storage.sync.get(null, function(items) {
    var menu = document.getElementById('menu');
    Object.keys(items).forEach(function(groupName) {
      if (groupName !== 'baseList' && groupName !== 'Default') {
        var groupElem = document.createElement('option');
        groupElem.innerHTML = groupName;
        menu.appendChild(groupElem);
      }
    });
  });

  addGroupTabs('Default');
});
