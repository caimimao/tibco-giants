
![LOGO](https://raw.github.com/longwosion/tibco-giants/master/images/giants-logo.gif)

## Collections of TIBCO GI Builder enhancement plugins.

* PlugInMonitor Show AMP Plugins information in treeview at runtime.
* BatchRenamer Rename multi-components in batch, also support generation Hungarian prefix and replacement based on Regular expression.
* Sokoban a GI clone of classical game: Sokoban (Warehouse keeper) is a transport puzzle in which the player pushes boxes around a maze, viewed from above, and tries to put them in designated locations.
* Filterable OpenFile Dialog provide a filter feature to open file dialog, you could use fitler to locate the file you want to open quickly by regular expression.
* Enhancement Mapping provide a visual tool to migrate mapping from old rule file to new file based on changed wsdl file.


### PlugInMonitor

When we create AMP based project, there should be many plugins in one project.
If we have not global overview of all plugins/extension-points/extensions, it's difficult for us to understand the architecture deeply.

In the past, we must open all plugin.xml file and read them or search key words in them.

By the way, GI Builder is a AMP based project and it use about sixty plugins (not include simple GI Class wrapper plugin, such as jsx3.gui.Block).

I create Plugun Monitor plugin for convenience, then we could navigate all plugins at RUNTIME in tree-based view.

#### Feature #### 
  * Display all plugins list in treeview.
  * Display all extension-point/extension in treeview as child nodes of the plugin.
  * Show detail information of every plugin (support hypertext-link), you could easily jump from one extension-point to its extension plugin, and also could show all extensions which extend some one extension-point.
  * Different icon for different plugin state "loaded or not"

![Figure1](https://raw.github.com/longwosion/tibco-giants/master/images/pluginMonitor2.png)

### BatchRenamer


Everyday We create or modify GUI file with GI builder, and every GUI file should have many GI components.
Sometimes, for get unique name in global scope, we maybe add different prefix or suffix to different GUI file. such as:

*blkContent_A100*,*mtxMain_A101*

Here, A100 or A101 could be the screen ID to identify which screen this component belong to.

we also add [http://en.wikipedia.org/wiki/Hungarian_notation Hungarian notation] prefix to note this components is a instance of jsx3.gui.Block or jsx3.gui.Matrix.

It's horrible to change name of components one by one manually, so batch renamer plugin is born


#### Features #### 

  * Rename multi-components in batch
  * Support replacement based on Regular expression, so you could easy add same suffix or prefix to all components.
  * Support generate Hungarian notation prefix based on GI Class, you also add new Hungarian notation rule for your custom class or change pre-defined Hungarian notation rule of existed GI system class.

#### Figures #### 

  * New icon button added to dom palette.

![Figure2](https://raw.github.com/longwosion/tibco-giants/master/images/BatchRenamer-Button.png)

  * Pop-up batch rename dialog, we are using regular expression to add a suffix

![Figure3](https://raw.github.com/longwosion/tibco-giants/master/images/BatchRenamer-RenameDialog.png)

  * Hungarian notation setting dialog

![Figure4](https://raw.github.com/longwosion/tibco-giants/master/images/BatchRenamer-PrefixSetting.png)


### Sokoban

This is a classical game, I just clone it with gi framework.

-- From [http://en.wikipedia.org/wiki/Sokoban wikimedia]

  Sokoban (倉庫番, Sōkoban?, warehouse keeper) is a transport puzzle in which the player pushes boxes around a maze, viewed from above, and tries to put them in designated locations. Only one box may be pushed at a time, and boxes cannot be pulled. The puzzle is usually implemented as a video game.

This clone version have 64 levels. The passed number will be shown in the right-bottom corner.

Try it and test how many levels you could pass :)

![Figure6](https://raw.github.com/longwosion/tibco-giants/master/images/sokoban.png)


### Filterable Open Dialog ### 

We enhance the open file dialog to add a file name filter, you could use this filter to locate special file quickly by name snippet or regular expression based query.


![Figure7](https://raw.github.com/longwosion/tibco-giants/master/images/FilterableDialog.png)


### Enhancements of Mapping Tools ### 

#### Features: #### 

 * Quick locate the operation by name
 * Auto migration rules from existed mapping file (From Luke's tool)

![Figure8](https://raw.github.com/longwosion/tibco-giants/master/images/OperationLocate.png)


![Figure9](https://raw.github.com/longwosion/tibco-giants/master/images/Mapping.png)
