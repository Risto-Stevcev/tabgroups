# Tab groups

A chrome extension that is a variation of the firefox tab group feature. Here is what the bare popup looks like:

![popup](https://raw.githubusercontent.com/Risto-Stevcev/tabgroups/master/tabgroup-popup.png)

* **Left panel** - The tab group that it currently selected (in this case, the default group). You can drag tabs from the right panel (the base panel) to the left panel (your tab group), specifically in the "Drop here" section.
* **Right panel** - The base window from where you wish to drag tabs. In this case, "Set as base" is still a link, indicating that the current window is not set as the base window. If you have a few tabs open in the current window and you click "Set as base", the panel will be populated by the tabs in your window.
* **Drop down** - A drop down of the available tab groups. If you create a new tab group, it will be available in this dropdown.
* **Check icon** - Loads the currently selected tab group into the current window. If tabs from the tab group are still open in another window, they are just moved so that the tab's state is kept. Otherwise it opens the tab url from scratch.
* **Cross icon** - Removes the currently selected tab group.
* **Plus icon** - Adds a new tab group.
* **Trash icon** - Drag a tab from the tab group.

See the screenshots in the `screenshots/` folder for more details.


# Contributing

1. Clone this repository.
2. In Chrome, go to chrome://extensions and check "Developer mode".
3. Click "Load unpacked extension..." and select the cloned repo folder.
