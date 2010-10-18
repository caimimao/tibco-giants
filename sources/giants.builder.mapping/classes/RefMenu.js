jsx3.lang.Class.defineClass("giants.builder.mapping.RefMenu",
        jsx3.gui.Menu, null, function(KLASS, instance) {


//get the absolute node path; since most WSDL updates are additions, this will handle 90% of all remaps, since the node names do not change
  function getNodePath(objP) {
    var strPath = objP.getAttribute("jsxtext");
    objP = objP.getParent();
    while(objP.getAttribute("type") != "S") {
      strPath = objP.getAttribute("jsxtext") + "/" + strPath;
      objP = objP.getParent();
    }
    return strPath;
  }

  //generate the XPath query necessary to match an existing rule to a new rule
  function getBindingQuery(strPath) {
    var objPath = strPath.split("/");
    var arrQuery = [];
    for(var i=0;i<objPath.length;i++) {
      arrQuery.push("record[@jsxtext='" + objPath[i] + "']");
    }
    //wsdl   //service  //op, mep, etc
    return "/" + "*/" + "*/" + "*/" + arrQuery.join("/");
  }

  //get native DOM node
  function $(s) {
    return document.getElementById(s);
  }
  
  
  instance.RECENT_FILES_MAX = 10;

  instance.onRsrcLoad = function() {

    jsx3.sleep(jsx3.$F(function(){
      this.disableItem("close");
      this.loadRecentFilesMenu();
    }).bind(this));
  };

  instance.loadRecentFilesMenu = function() {
    var files = this.getRecentFiles();
    if (files.length == 0) {
      this.disableItem("recent");
      return;
    }
    this.enableItem("recent");
    for (var i = 0; i < files.length; i++) {
      var path = files[i];
      var record = {jsxid: "recent:" + path, jsxtext: path,
          jsxexecute: "this.loadRefRuleTree(objRECORD.getAttribute('jsxtext'));"};
      this.insertRecord(record, "recent", true);
    }
    this.repaint();
  };

  instance.onMenuExecute = function(strAction) {
    if(strAction === "open") {
      this.browseRefRule()
    } else if (strAction === "close") {
      this.closeRefRulePane();
    } else if (strAction == "transfer") {
      this.autoMigrate();
    }
  };

  instance.browseRefRule = function(strTitle) {
    if(!strTitle)
      strTitle = "Choose Mapping Rules File";
    jsx3.ide.getPlugIn("jsx3.io.browser").chooseFile(jsx3.IDE.getRootBlock(), {
      name:"jsxdialog", modal:true, title:strTitle, okLabel:"OK",
      folder: jsx3.ide.getCurrentDirectory(), onChoose: jsx3.$F(function(objFile) {
        var strPath = jsx3.net.URI.decode(jsx3.ide.PROJECT.getDirectory().relativePathTo(objFile));
        this._addToRecentFiles(objFile);
        this.loadRefRuleTree(strPath);
        this.loadRecentFilesMenu();
        jsx3.ide.setCurrentDirectory(objFile.getParentFile());
      }).bind(this)
    });
  };

  instance.closeRefRulePane = function() {
    var mapper = this.getAncestorOfType(jsx3.ide.mapper.Mapper);
    mapper.getDescendantOfName("jsx_schema_rulestree_pane").setCols("100%,0", true);
    this.disableItem("close");
  };

  instance.getRefRulesTree = function() {
    var mapper = this.getAncestorOfType(jsx3.ide.mapper.Mapper);
    return mapper.getDescendantOfName("jsx_schema_ref_rulestree");
  };

  instance.loadRefRuleTree = function(strPath) {
    this._jsxrefrulepath = strPath;
    var mapper = this.getAncestorOfType(jsx3.ide.mapper.Mapper);
    mapper.getDescendantOfName("jsx_schema_rulestree_pane").setCols("50%,50%", true);
    var objXML = this.getRefRulesTree().getServer().getCache().openDocument(jsx3.ide.PROJECT.resolveURI(strPath));
    this.getRefRulesTree().resetCacheData();
    this.getRefRulesTree().getServer().getCache().setDocument(this.getRefRulesTree().getXSLId(), mapper.getRulesTree().getXSL());
    this.getRefRulesTree().getServer().getCache().setDocument(this.getRefRulesTree().getXMLId(),objXML);
    this.getRefRulesTree().repaint();
    this.enableItem("close");
  };

  instance.autoMigrate = function() {

    var objDoc = this.parseOldRulesFile(this._jsxrefrulepath);
    var objMapper = this.getAncestorOfType(jsx3.ide.mapper.Mapper);
    var objTree = objMapper.getRulesTree();
    //remove unneccessary operations
    var operationNodes = objMapper.getRulesXML().selectNodeIterator("//record[@type='P']");
    while(operationNodes.hasNext()) {
      var operationNode = operationNodes.next();
      if(!this._jsxoperations[operationNode.getAttribute("jsxtext")]) {
        operationNode.getParent().removeChild(operationNode);
      }
    }
    objMapper.getRulesTree().repaint();

    var nodesToExpand = objMapper.getRulesXML().selectNodeIterator("//record[@type='I' or @type='O' or @type='F' ]");
    while(nodesToExpand.hasNext()) {
      var nodeToExpand = nodesToExpand.next();
      objTree.toggleItem(nodeToExpand.getAttribute("jsxid"),true);
    }

    jsx3.log("about to auto-expand");
    this.expandedRules = {};
    this.doAutoExpand(objMapper, objTree, objDoc);
    //this._doAutoMigrate(objMapper, objTree);
    return;
  };

  //expand all rules in the mapper (simulates the user dbl-clicking each rule to expand)
  instance.doAutoExpand = function(objMapper,objTree,objDoc) {
    //auto expand all nodes in the mapper
    jsx3.log('auto-expanding');
    var nodesToExpand = objMapper.getRulesXML().selectNodeIterator("//record[@type='C' and not(record)]");
    var bFound = false;
    while(nodesToExpand.hasNext()) {
      var nodeToExpand = nodesToExpand.next();
      var strId = nodeToExpand.getAttribute("jsxid");
      if(!this.expandedRules[strId]) {
        bFound = true;
        jsx3.log(strId);
        this.expandedRules[strId] = true;
        objMapper.doDrill(strId,true,objTree,objTree.getRecordNode(strId));
      }
    }

    if(bFound) {
      //there's probably more to expand, call again...
      jsx3.sleep(function() { this.doAutoExpand(objMapper,objTree,objDoc); }, null, this);
    } else {
      //all done auto-expanding; call method to bind the existing mappings to rules in the new rules file
      this.doAutoMigrate(objMapper,objTree,objDoc);
    }
  };  

  //automatically move existing mapping rules to the newly-generated rules tree if the absolute node path is an exact node-name match
  instance.doAutoMigrate = function(objMapper,objTree, objXML) {
    //clone the mapper's rules tree and place in the migration utility
    var objNewXML = objMapper.getRulesXML();
    var strTreeId = objTree.getId() + "_";
    var objMapNodes = objXML.getRootNode().getChildIterator();
    while(objMapNodes.hasNext()) {
      var objMapNode = objMapNodes.next();
      //generate the binding query by using the 'nodepath' attribute
      var strPath = objMapNode.getAttribute("nodepath");
      jsx3.log(strPath);
      var strQuery = getBindingQuery(strPath);
      jsx3.log(strQuery);
      var objNode = objNewXML.selectSingleNode(strQuery);
      if(objNode) {
        //objNode.setAttribute("oldnodepath",strPath);
        objNode.appendChild(objMapNode.selectSingleNode("mappings").cloneNode(true));
        objTree.redrawRecord(objNode.getAttribute("jsxid"), jsx3.xml.CDF.UPDATE);
        this.getRefRulesTree().insertRecordProperty(objMapNode.getAttribute('jsxoldid'), "jsxstyle", "text-decoration:line-through;color:#999;background-color:#ffffcc", false);
        $(strTreeId + objNode.getAttribute("jsxid")).firstChild.style.backgroundColor = "#ffffcc";
      }
    }
    this.focus();
    this.getRefRulesTree().repaint();
    alert('Any mapping rules shown with a strike-through were successfully transferred (they are likewise highlighted in the rules tree). Manually drag and drop any remaining rules without a strike-through.');
  }

  instance.parseOldRulesFile = function(strPath) {
    var objXML = this.getServer().getCache().openDocument(jsx3.ide.PROJECT.resolveURI(strPath));
    var objNodes = objXML.selectNodeIterator("//record[mappings]");
    var objDoc = jsx3.xml.CDF.Document.newDocument();
    var objRoot = objDoc.getRootNode();
    while (objNodes.hasNext()) {
      var objNode = objNodes.next();
      var objClone = objNode.cloneNode(true);
      objClone.setAttribute("nodepath", getNodePath(objNode));
      objClone.setAttribute("jsxoldid", objClone.getAttribute("jsxid"));
      var strId = "old_" + parseInt(Math.random() * 100000);
      objClone.setAttribute("jsxid", strId);
      objRoot.appendChild(objClone);
    }

    //get operation names in old rules
    this._jsxoperations = {};
    var objOperations = objXML.selectNodeIterator("//record[@type='P']");
    while(objOperations.hasNext()) {
      var objOperation = objOperations.next();
      this._jsxoperations[objOperation.getAttribute('jsxtext')] = 1;
    }
    return objDoc;
  };

  instance._addToRecentFiles = function(objFile) {
    var settings = jsx3.ide.getIDESettings();
    var project = jsx3.ide.PROJECT;
    var strPath = project.getDirectory().relativePathTo(objFile);

    var recent = settings.get('projects', project.getPathFromHome(), 'recentRuleFiles') || [];
    for (var i = 0; i < recent.length; i++) {
      if (recent[i] == strPath) {
        recent.slice(i, 1);
        break;
      }
    }

    recent.unshift(strPath);
    if (recent.length > this.RECENT_FILES_MAX) recent.pop();

    settings.set('projects', project.getPathFromHome(), 'recentRuleFiles', recent);
  };

  instance.getRecentFiles = function() {
    var project = jsx3.ide.PROJECT;
    if (!project)
      return [];

    var settings = jsx3.ide.getIDESettings();
    return settings.get('projects', project.getPathFromHome(), 'recentRuleFiles') || [];
  };

});