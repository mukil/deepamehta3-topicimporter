function dm3_topicimporter() {

  var LOG_TOPICMAPIMPORTER = false
  //
  var TAB = "\\t";
  var COMMA = ",";
  //
  var topicTypeToCreate = "";
  var topicToRelateTo = "none.";



  // --------------------
  // --- Overriding Hooks
  // --------------------
  
  

  this.init = function() {
    dm3c.add_to_special_menu({label: "Topic Importer..."})
  }

  // register special command
  this.handle_special_command = function(specialcommand) {
    // if we are called
    if (specialcommand == "Topic Importer...") {
      // clear detail pane
      dm3c.empty_detail_panel()
      // add our user interface
      $('#detail-panel').append('<div id="importerform"></div>')
      $('#importerform').css('font-size', '10px')
      $('#importerform').css('line-height', '1.2em')
      // the topic to which all imported items possibly will be related to 
      // must currently already be selected before starting the topic importer
      if (dm3c.selected_topic != null)
          if (typeof(dm3c.selected_topic) != "undefined" ) topicToRelateTo = dm3c.selected_topic.id;
      // rest of the user interface
      // ask user for file
      $('#importerform').append('<b>Enter text to import</b> and <b>select the fields delimiter</b>: &nbsp;')
      $('#importerform').append('<select id="delimiterSelect" name="delimiter" '
        + ' size="1"><option value="' + COMMA + '">Comma</option><option value="' + TAB + '">Tabulator</option></select><br/>')
      $('#importerform').append('<textarea id="importtext" cols="40", rows="4"></textarea><br/>')
      // $('#importerform').append('<a href="buildPreview()"><b>Generate Preview</b></a><br/>')
      // edit content and options triggers regexp analysis
      $('#delimiterSelect').bind('change', buildPreview)
      $('#importtext').bind('change', buildPreview ) // re-activated
      // fine tuning triggers just the parsetext again
      $('#regexpr').bind('change', parsetext )
      $('#regexps').bind('change', parsetext )
      $('#importerform').append('<br/><b>Content Live Preview</b><div id="parsedtext"></div>')
      $('#parsedtext').css('height', '100px')
      $('#parsedtext').css('position', 'relative')
      $('#parsedtext').css('overflow', 'auto')
      $('#parsedtext').css('white-space', 'pre')
      $('#importerform').append('<input id="num_fields" type="hidden" value="0" />')
      $('#importerform').append('<table id="uritable"></table>')
      // get selected topictype from create menu
      topicTypeToCreate = dm3c.ui.menu_item("create-type-menu").value
      // and build up the field / uri matching form
      fillTypeUriTable()
      if (topicToRelateTo != "none.") $('#importerform').append('Topic Importer will relate all new topics ' 
        + 'to the currently selected topic in the map <b id="selectedInfo"> (ID: ' + topicToRelateTo + ')</b><br/>')
      // send button
      $('#importerform').append('<button id="importerformgo">Start Import</button>')
      $('#importerformgo').click(do_creations);
      // status message
      $('#importerform').append('<span id="importerformstatus"> Awaiting Configuration </span> <p/>')
      $('#importerform').append('<br/><b>Advanced Configuration for expert users</b><br/><label for="regexps">Regexp Search</label>&nbsp;<input id="regexps" cols="41" type="text" value="/(.*)/g"/><br />')
      $('#importerform').append('<label for="regexpr">Regexp Replace</label><input id="regexpr" cols="40" type="text" value="$1" /><br />')
    }
  }

  function buildPreview() {
      buildRegexp({}) // without any field-settings
      parsetext()
  }

  function handleDataFieldChange() {
      var wantedFields = new Array();
      var fieldAtNumber = {};
      // go through all options and collect wanted (if value not 0)
      for (p = 0; p < $('#num_fields').val(); p++) {
          var value = $('#uriold-'+p).val();
          if (value != 0) {
              fieldAtNumber.key = value;
              wantedFields.push(fieldAtNumber);
          }
      }
      buildRegexp(wantedFields);
      parsetext();
  }

  function buildRegexp (fieldSettings) {
      // build regexp on handleDataFieldChange()
      var regexp = "/";
      var replace = "";
      var delimit = $("#delimiterSelect").val();
      // number of datafields identified in inputtext
      var itemCount = checkText(delimit);
      if (fieldSettings.length == 1) {
        $("#regexps").val("/(.*)/g");
        $("#regexpr").val("$1");
      } else {
        for (w = 0; w < fieldSettings.length; w++) {
          // build regexp string
          if (delimit == "\\t" && w ==  fieldSettings.length-1 ) {
            // at the last field but inputDataanalyzer sais
            // there are fields left, so we pack them into one
            if (itemCount > fieldSettings.length) {
              regexp += "(.*)/g";
            } else if (itemCount < fieldSettings.length) {
              alert("Attention: More DataFields wanted then fields found in the inputtext. Consider your choice.");
            } else {
              regexp += "([^\\t]*)/g";
            }
            $("#regexps").val(regexp);
          } else if (delimit == "\\t") {
            regexp += "([^\\t]*)\\t";
          }
          if (delimit == COMMA && w == fieldSettings.length-1) {
            regexp += "([^,]*)/g";
            $("#regexps").val(regexp);
          } else if (delimit == COMMA) {
            regexp += "([^,]*)" + COMMA;
          }
          // build replace string
          var lineNumber = w+1;
          if (w == 0) {
            replace += "$"+lineNumber;
          } else if (fieldSettings.length >= 1) {
            replace += "\\n$"+lineNumber;
          }
        }
      }
      $("#regexps").val(regexp);
      $("#regexpr").val(replace);
      // alert("wantedFilelds: " + fieldSettings.length +"... :"+ regexp + " ... " + replace);
  }

  /** calculates the number of elements delimited */
  function checkText(delimiter) {
    var firstLine = $('#importtext').val().split("\n")[0]
    if (delimiter == "\\t") {
      return firstLine.split("\t").length
    }
    return firstLine.split(delimiter).length
  }

  /**
    * builds the html form which enables the user to match their input data attribute
    * to the datafields of the currently selected topictype
    *
    * user-interaction with the select-fields manipulates the regexp replace input field
    * and generates a new preview according to the number of wanted datafields..
    */
  function fillTypeUriTable() {
    // this part is to match a data field uri with a given line number
    // get uri of datafields
    var fields=dm3c.restc.get_topic_type(topicTypeToCreate).fields
    // get the number of user fileds = total number minus the data fields
    var num_fields = fields.length-2
    $('#num_fields').val(num_fields); // update hidden number of fields
    // ### ToDo: also substract all reference / relation data fields
    $('#uritable').empty()
    $('#uritable').append('<tr><th><b id="typeInfo">' + typeNamesToDisplay(topicTypeToCreate) + 's</b> DataFields</th><th>Match Replace Item</th></tr>')
    var selectoptions=""
    for (var i = 1; i <= num_fields; i++) {
      selectoptions+='<option value="' + i + '">' + i + '</option>'
    }
    selectoptions+='<option value="0" selected="selected">-</option>'
    for (var idx = 0, a = 0, field; field = fields[idx]; idx++) {
      // omit the data fields
      if ( field.uri != "de/deepamehta/core/property/DateCreated" &&
        field.uri != "de/deepamehta/core/property/DateModified") {
        var urio = 'uriold-' + a
        $('#uritable').append('<tr><td id="urinew-'+a+'">' + field.uri + '</td>'
          + '<td><select id="' + urio + '" size="1">' + selectoptions + '</select></tr>')
        $('#' + urio).change(handleDataFieldChange)
        a++
      }
    }
    // assume the topmost uri is the label, so select this as default for line number 1
    $('#uriold-0 option[value="1"]').attr('selected', 'selected');
  }

  // parse the pasted text, apply the regexp (which matches either on COMMA or TAB)
  // return an array of lines == potential topics
  function do_parse() {
    var otext=$('#importtext').val()
    // first user regexp
    var regex= eval($('#regexps').val())
    var replacement= $('#regexpr').val()
    // whitespace chracters get quoted in input, so replace them
    // inspired by http://www.rexv.org/
    if (replacement != "") {
      replacement = replacement.replace( /\\n/g, "\n" )
      replacement = replacement.replace( /\\r/g, "\r" )
      replacement = replacement.replace( /\\s/g, "\s" )
      replacement = replacement.replace( /\\t/g, "\t" )
    }
    var rtext=otext.replace(regex, replacement)
    var lines=rtext.split("\n");
    return lines
  }

  // go through the user given order of uri to line numbers and
  // return an associative array where elements are [datafield uri]=field_index
  function get_field_uri_mapping() {
    var oa = new Array()
    for (var i = 0; i < $('#num_fields').val(); i++) {
      var urio = 'uriold-' + i
      oa[i] = $('#'+urio).val()
    }
    return oa
  }

  // find the numeric max in an array of numbers
  function max_array(arr) {
    var max=Number.MIN_VALUE;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i]
      }
    }
    return max
  }

  // write the parsed text to screen and append the user chosen line numbers
  function parsetext() {
    if (topicTypeToCreate != dm3c.ui.menu_item("create-type-menu").value) {
      topicTypeToCreate = dm3c.ui.menu_item("create-type-menu").value
      fillTypeUriTable()
    }
    var lines=do_parse()
    var max_line=max_array(get_field_uri_mapping())
    // clear the textbox and fill it again
    $('#parsedtext').empty()
    // the numbers in front of the line correspond to the line numbers the field uris are related to
    for (var i = 0, a = 1; i < lines.length; i++, a++) {
      if (a > max_line) {
        a = 1
      }
      if (max_line == 0) { 
        $('#parsedtext').append('-: ' + lines[i] + '\n')
      } else {
        $('#parsedtext').append(a+': ' + lines[i] + '\n')
      }
    } 
  }   

  // do the work, read the text and create the topics
  function do_creations() {
    // status
    $('#importerformstatus').empty()
    $('#importerformstatus').append(' importing..')

    // get lines/topics from text
    var lines=do_parse()
    // 
    var uri_field_map=get_field_uri_mapping()
    var number_of_wanted_fields=max_array(uri_field_map)
    // add some empty fields just to be sure to fill up the last line
    for ( var lj = 0; lj < number_of_wanted_fields; lj++ ) {
      // adding a line? cause there are to less fields?
      lines.push("")
    }
    // prop will hold the properties of the new topic
    var prop = {}
    dm3c.canvas.start_grid_positioning()
    // go through all lines first, before creating any topic with a really crazy loop
    for (var lineIdx = 0, fieldIdx = 1; lineIdx < lines.length; lineIdx++, fieldIdx++) {
      // if we have read enough fields to create a topic, we create one for each line
      // through manipulating fieldIdx
      if (fieldIdx > number_of_wanted_fields && js.size(prop) > 0) {
        // create topic
        var topic = dm3c.create_topic(topicTypeToCreate, prop)
        if (lineIdx == 2) { // this is the second time all lines are iterated making 1=2 and 2=4
          dm3c.add_topic_to_canvas(topic, "show")
        } else {
          dm3c.add_topic_to_canvas(topic, "none")
        }
        // if there has been a topic selected, relate to it
        if (topicToRelateTo != "none.") {
          var rel = dm3c.create_relation("RELATION", topicToRelateTo, topic.id)
          dm3c.canvas.add_relation(rel.id, rel.src_topic_id, rel.dst_topic_id)
        }
        // prepare? for next topic
        fieldIdx = 1
        prop = {}
      }
      // for each line/topic
      // start to fill the properties of the current topic and ommit empty lines
      if (lines[lineIdx] != "") {
        // see which uri will receive this field
        for (var p = 0; p < $('#num_fields').val(); p++) {
          if (uri_field_map[p] == fieldIdx) {
            var key = $('#urinew-'+p).text()
            var value = lines[lineIdx]
            prop[key.toString()] = value.toString()
          }
        }
      }
    }
    dm3c.canvas.stop_grid_positioning()
    // status
    $('#importerformstatus').empty()
    $('#importerformstatus').append('Finished')
  }

  //
  // --- Little Helpers
  //

  function typeNamesToDisplay(typeString) {
    return typeString.substring(typeString.lastIndexOf("/")+1);
  }

}
