document.addEventListener('DOMContentLoaded', function() {
  function allowDrop(event) {
    event.preventDefault();
  }


  function getId(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
  }


  function addTab(event) {
    event.preventDefault();
    var id = event.dataTransfer.getData('text/plain');
    if (id.slice(0,3) !== 'tab') {
      var element = document.getElementById(id);

      var newElement = document.createElement('li');
      newElement.setAttribute('id', 'tab' + element.id);
      newElement.setAttribute('class', 'span grab');
      newElement.setAttribute('draggable', 'true');
      newElement.addEventListener('dragstart', getId);
      newElement.innerHTML = element.innerHTML;

      event.target.parentNode.getElementsByTagName('ul')[0].appendChild(newElement);
    }
  }


  function removeTab(event) {
    event.preventDefault();
    var id = event.dataTransfer.getData('text/plain');
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }


  function addBaseElements(baseList) {
    /* Remove tab elements */
    while (baseList.hasChildNodes())
      baseList.removeChild(baseList.lastChild);

    chrome.storage.sync.get('baseList', function(item) {
      if (item.baseList) {
        chrome.windows.get(item.baseList, {populate: true}, function(_window_) {
          /* Add tab elements */
          _window_.tabs.forEach(function(tab) {
            var listItem = document.createElement('li');
            listItem.setAttribute('id', tab.id);
            listItem.setAttribute('class', 'span grab');
            listItem.setAttribute('draggable', 'true');
            listItem.innerHTML = "<img src='" + (tab.favIconUrl ?
                                                 tab.favIconUrl :
                                                 'chrome://favicon/' + tab.url) + 
                                 "' class='icon'>" + tab.title;
            baseList.appendChild(listItem);
          });

          /* Add tab event listeners */
          var elements = document.getElementsByClassName('span grab');
          Array.prototype.forEach.call(elements, function(element) {
            element.addEventListener('dragstart', getId);
          });
        }); 
      }
    });
  }


  function disableBaseLink() {
    var newElement = document.createElement('span');
    var baseLink = document.getElementById('baselink');
    newElement.innerHTML = baseLink.innerHTML;
    baseLink.parentNode.replaceChild(newElement, baseLink);
  }


  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


  /* Add elements */
  chrome.storage.sync.get('baseList', function(item) {
    if (item.baseList)
      addBaseElements(document.getElementById('baselist'));
    else
      (function addNoBaseSetInfo() {
        var listItem = document.createElement('li');
        listItem.innerHTML = 'No base set.';
        document.getElementById('baselist').appendChild(listItem);
      })();
  });


  /* Add icon event listeners */
  var dropArea = document.getElementById('droparea');
  dropArea.addEventListener('dragover', allowDrop, false);
  dropArea.addEventListener('drop', addTab, false);

  var trash = document.getElementById('trash'); 
  trash.addEventListener('dragover', allowDrop, false);
  trash.addEventListener('drop', removeTab, false);


  /* Add custom listeners */
  document.addEventListener('addBaseList', function(event) {
    chrome.windows.getCurrent(function(_window_) {
      chrome.storage.sync.set({'baseList': _window_.id}, function() {
        addBaseElements(document.getElementById('baselist'));
      });
    });
  });

  document.addEventListener('addGroup', function(event) {
  });

  document.addEventListener('removeGroup', function(event) {
  });


  /* Add custom link listeners */
  var onAddBaseList = document.createEvent('Event');
  onAddBaseList.initEvent('addBaseList', true, true);

  var onAddGroup = document.createEvent('Event');
  onAddGroup.initEvent('addGroup', true, true);

  var onRemoveGroup = document.createEvent('Event');
  onRemoveGroup.initEvent('removeGroup', true, true);

  document.getElementById('baselink').addEventListener('click', function(event) {
    document.dispatchEvent(onAddBaseList);
    disableBaseLink();
  });

  document.getElementById('addgroup').addEventListener('click', function(event) {
    document.dispatchEvent(onAddGroup);
  });

  document.getElementById('removegroup').addEventListener('click', function(event) {
    document.dispatchEvent(onRemoveGroup);
  });


  /* Storage */
  chrome.storage.onChanged.addListener(function(changes, areaName) {
    console.log('strg', changes);
  });


  chrome.storage.sync.get('baseList', function(item) {
    if (item.baseList) {
      chrome.windows.getCurrent(function(_window_) {
        if (item.baseList === _window_.id)
          disableBaseLink();
      });
    }
  });
});
