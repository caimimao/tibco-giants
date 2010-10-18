(function(plugIn) {

  plugIn.PC_OPEN_RULES_PANE = "giant.builder.mapping.PC_OPEN_RULES_PANE";
  plugIn.PC_FORMAT_TOOLBAR = "giant.builder.mapping.PC_FORMAT_TOOLBAR";
  plugIn.PC_RULE_DROP = "giant.builder.mapping.PC_RULE_DROP"

  plugIn.injectAOP = function() {
    jsx3.lang.AOP.pc(plugIn.PC_OPEN_RULES_PANE, {classes: "jsx3.ide.mapper.Mapper", methods: "loadRulesPane"});
    jsx3.lang.AOP.after(plugIn.PC_OPEN_RULES_PANE, function() {
      plugIn.injectFilterBox(this);
      plugIn.injectAddMenus(this);
      plugIn.injectRefRules(this);
    });

    jsx3.AOP.pc(plugIn.PC_RULE_DROP, {classes:"jsx3.ide.mapper.Mapper", methods:"onRuleDrop"});
    jsx3.AOP.around(plugIn.PC_RULE_DROP, function(aop,objRulesTree,objSourceTree,strDraggedIds,strRuleId,bInsertBefore) {
      if(objSourceTree.getName() == "jsx_schema_ref_rulestree") {
        //user is doing a manual mapping transfer
        var objNode = objRulesTree.getRecordNode(strRuleId);
        var objMapNode = objSourceTree.getRecordNode(strDraggedIds[0]);
        jsx3.log("manual transfer: " + objNode);
        objNode.appendChild(objMapNode.selectSingleNode("mappings").cloneNode(true));
        document.getElementById(objRulesTree.getId() + "_" + objNode.getAttribute("jsxid")).firstChild.style.backgroundColor = "#ffffcc";
        objSourceTree.insertRecordProperty(objMapNode.getAttribute("jsxid"),"jsxstyle","text-decoration:line-through;color:#999;background-color:#ffffcc;",false);
        objSourceTree.redrawRecord(objMapNode.getAttribute("jsxid"), jsx3.xml.CDF.UPDATE);
        return false;
      } else {
        //proceed a usual, just a regular drop that the mapper knows how to handle
        return aop.proceed(objRulesTree,objSourceTree,strDraggedIds,strRuleId,bInsertBefore);
      }
    });


    jsx3.lang.AOP.pc(plugIn.PC_FORMAT_TOOLBAR, {classes: "jsx3.ide.mapper.Mapper", methods: "formatToolbar"});
    jsx3.lang.AOP.after(plugIn.PC_FORMAT_TOOLBAR, function(rv, objMenu) {
      var objTree = this.getRulesTree();
      var oVal = objTree.getValue();
      var i21 = 0;

      for (var i=0;i<oVal.length;i++) {
        var strType = objTree.getRecordNode(oVal[i]).getAttribute("type");
        if (strType == 'C' || strType == 'E' || strType == 'A') {
          if (i21 != -1) i21+=1;
        } else {
          i21 = -1;
        }
      }

      var menus = giants.builder.mapping.CustomMap.injectedMenus;
      for(var i=0; i< menus.length; i++) {
        if (i21 > 0) {
          objMenu.enableItem(menus[i].jsxid);
        } else {
          objMenu.disableItem(menus[i].jsxid);
        }
      }        
    });
  };

  plugIn.injectFilterBox = function(mapper) {
    var container = mapper.getDescendantOfName("jsx_schema_rules_container");
    var layoutGrid = container.getChild(0);
    plugIn.loadRsrcComponent("locate_XML", layoutGrid, false);
    layoutGrid.insertBefore(layoutGrid.getChild(4), layoutGrid.getChild(3));
    layoutGrid.setRows("22,24,*,24", true);
  };

  plugIn.injectAddMenus = function(mapper) {
    var add_menu = mapper.getDescendantOfName("jsx_schema_menu_add");
    var menus = giants.builder.mapping.CustomMap.injectedMenus;
    for(var i=0; i< menus.length; i++) {
      add_menu.insertRecord(menus[i]);
    }
  };

  plugIn.injectRefRules = function(mapper) {
    var treeBlock = mapper.getDescendantOfName("jsx_schema_rulestree").getParent();
    var treePane = plugIn.loadRsrcComponent("refRuleTreePane_XML", treeBlock, true);
    treePane.getChild(0).adoptChild(mapper.getDescendantOfName("jsx_schema_rulestree"), true);

    var add_menu = mapper.getDescendantOfName("jsx_schema_menu_add");
    var refMenu = plugIn.loadRsrcComponent("refMenu_XML", add_menu.getParent(), true);
  };

  plugIn.injectAOP();

})(this);