jsx3.lang.Class.defineClass("giants.builder.mapping.CustomMap",
        null, null, function(KLASS, instance) {

  KLASS.injectedMenus = [
    {jsxid: "x1", jsxtext: "SetValue By Path", jsxdivider: "1",
      jsxexecute: "giants.builder.mapping.CustomMap.doCustomMap(this.getAncestorOfType(jsx3.ide.mapper.Mapper), 'x1');"},
    {jsxid: "x2", jsxtext: "SetRepeat By Path",
      jsxexecute: "giants.builder.mapping.CustomMap.doCustomMap(this.getAncestorOfType(jsx3.ide.mapper.Mapper), 'x2');"},
    {jsxid: "x3", jsxtext: "SetRepeatValue By Path",
      jsxexecute: "giants.builder.mapping.CustomMap.doCustomMap(this.getAncestorOfType(jsx3.ide.mapper.Mapper), 'x3');"},
    {jsxid: "x4", jsxtext: "CDF Record and recordType attribute",
      jsxexecute: "giants.builder.mapping.CustomMap.doCustomMap(this.getAncestorOfType(jsx3.ide.mapper.Mapper), 'x4');"}
  ];

  KLASS.doCustomMap = function(mapper, type) {
    var objTree = mapper.getRulesTree();
    var oVal = objTree.getValue();
    if(oVal.length == 1)
      mapper.writeMappings(true);
    for (var i=0;i<oVal.length;i++) {
      var strId = oVal[i];
      var objNode = objTree.getRecordNode(strId);
      var strType = objNode.getAttribute("type");
      if(type === "x1") this.setValueByPath(mapper, objTree, objNode);
      if(type === "x2") this.setRepeatByPath(mapper, objTree, objNode);
      if(type === "x3") this.setRepeatValueByPath(mapper, objTree, objNode);
      if(type === "x4") this.setCDFRecordType(mapper, objTree, objNode);
      objTree.redrawRecord(strId,jsx3.xml.CDF.UPDATE);
    };
    if(oVal.length == 1)
      mapper.readMappings(objTree,objNode,"mappings");
  };

  KLASS.getPathString = function(node) {
    var strPath = node.getAttribute('jsxtext');
    var parentNode = node.getParent();
    var strType = parentNode.getAttribute("type");
    while (strType == "A" ||strType == "E" ||strType == "C" ||strType == "D") {
      strPath = parentNode.getAttribute("jsxtext") + "." + strPath;
      parentNode = parentNode.getParent()
      strType = parentNode.getAttribute("type");
    }
    return strPath;
  };

  KLASS.setValueByPath = function(mapper, objTree, objRecNode) {
    var strPath = this.getPathString(objRecNode);
    var strScript = "MESSAGENODE.setValue(this.{path});";
    strScript = strScript.replace("{path}", strPath);
    mapper.bindComplexRule(objTree, objRecNode, "mappings","Script", strScript);
  };

  KLASS.setRepeatByPath = function(mapper, objTree, objRecNode) {
    var strPath = this.getPathString(objRecNode);
    var strScript = "(++this.{index})<(this.{path}.length-1)";
    strScript = strScript.replace("{path}", strPath).replace("{index}", "i");
    objRecNode.setAttribute("repeat", strScript);
    mapper.readMapping(objRecNode, "repeat");
  };

  KLASS.setRepeatValueByPath = function(mapper, objTree, objRecNode) {
    var strPath = this.getPathString(objRecNode);
    var strScript = "if(this.{repeatPath}[this.{index}]){MESSAGENODE.setValue(this.{repeatPath}[this.{index}].{path});}";

    //find repeatNode..
    var repeatNode=null, parentNode = objRecNode.getParent();
    var strType = parentNode.getAttribute("type");
    while (strType == "A" ||strType == "E" ||strType == "C" ||strType == "D") {
      if(parentNode.getAttribute('repeat') && parentNode.getAttribute('repeat') !== "") {
        repeatNode = parentNode;
        break;
      }
      parentNode = parentNode.getParent();
      strType = parentNode.getAttribute("type");
    }
    if(repeatNode !== null) {
      var strRepeatPath = this.getPathString(repeatNode);
      strPath = strPath.replace(strRepeatPath+".", "");
      strScript = strScript.replace("{repeatPath}", strRepeatPath).replace("{index}", "i").replace("{path}", strPath);
      strScript = strScript.replace("{repeatPath}", strRepeatPath).replace("{index}", "i").replace("{path}", strPath);
      mapper.bindComplexRule(objTree, objRecNode, "mappings","Script", strScript);
    } else {
      this.getLog().warn("This node doesn't belong to a repeat node!");
    }
  };

  KLASS.setCDFRecordType = function(mapper, objTree, objRecNode) {
    var strScript = "CDFCONTEXT.setAttribute('recordType', '{text}');"
    mapper.bindComplexRule(objTree, objRecNode, "mappings", "CDF Record","");
    strScript = strScript.replace("{text}", objRecNode.getAttribute("jsxtext"));
    mapper.bindComplexRule(objTree, objRecNode, "mappings","Script", strScript);
    var objNodes = objRecNode.selectNodes("record[@type='A' or @type='E']");
    for (var j = objNodes.iterator(); j.hasNext(); ) {
      var objNode = j.next();
      mapper.bindComplexRule(objTree,objNode,"mappings","CDF Attribute",objNode.getAttribute("jsxtext"));
    }
    var objNodes = objRecNode.selectNodes("record[@type='C']");
    for (var j = objNodes.iterator(); j.hasNext(); ) {
      var objNode = j.next();
      this.setCDFRecordType(mapper, objTree, objNode);
    }
  };

});