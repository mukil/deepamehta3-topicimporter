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
    // add special command
    $("#special-select").append($("<option>").text("Topic Importer"))
  }

  // register special command
  this.handle_special_command  = function(specialcommand) {
    // if we are called
    if (specialcommand == "Topic Importer") {
      // clear detail pane
      empty_detail_panel()
      // add our user interface
      $('#detail-panel').append('<div id="importerform"></div>')
      $('#importerform').css('font-size', '10px')
      $('#importerform').css('line-height', '1.2em')
      // the topic to which all imported items possibly will be related to 
      // must currently already be selected before starting the topic importer
      if ( selected_topic != null)
          if (typeof(selected_topic) != "undefined" ) topicToRelateTo = selected_topic.id;
      // rest of the user interface
      // ask user for file
      $('#importerform').append('<b>Enter text to import</b> and <b>select the fields delimiter</b>: &nbsp;')
      $('#importerform').append('<select id="delimiterSelect" name="delimiter" '
        + ' size="1"><option value="' + COMMA + '">Comma</option><option value="' + TAB + '">Tabulator</option></select><br/>')
      $('#importerform').append('<textarea id="importtext" cols="40", rows="4"></textarea><br/>')
      // $('#importerform').append('<a href="buildPreview()"><b>Generate Preview</b></a><br/>')
      // edit content and options triggers regexp analysis
      $('#delimiterSelect').bind('mouseover change', buildPreview)
      // $('#importtext').bind('change', buildPreview ) // deactivated
      // fine tuning triggers just the parsetext again
      $('#regexpr').bind('mouseover change', parsetext )
      $('#regexps').bind('mouseover change', parsetext )
      $('#importerform').append('<br/><b>Content Live Preview</b><div id="parsedtext"></div>')
      $('#parsedtext').css('height', '100px')
      $('#parsedtext').css('position', 'relative')
      $('#parsedtext').css('overflow', 'auto')
      $('#parsedtext').css('white-space', 'pre')
      $('#importerform').append('<input id="num_fields" type="hidden" value="0" />')
      $('#importerform').append('<table id="uritable"></table>')
      // get selected topictype from create menu
      topicTypeToCreate = ui.menu_item("create-type-menu").value
      // and build up the field / uri matching form
      fillTypeUriTable()
      if (topicToRelateTo != "none.") $('#importerform').append('Topic Importer will relate all new topics ' 
        + 'to the currently selected topic in the map <b id="selectedInfo"> (ID: ' + topicToRelateTo + ')</b><br/>')
      // send button
      $('#importerform').append('<button id="importerformgo">Start Import</button>')
      $('#importerformgo').click(doCreations);
      // status message
      $('#importerform').append('<span id="importerformstatus"> Awaiting Configuration </span> <p/>')
      $('#importerform').append('<br/><b>Advanced Configuration for expert users</b><br/><label for="regexps">Regexp Search</label>&nbsp;<input id="regexps" cols="41" type="text" value="/(.*)/g"/><br />')
      $('#importerform').append('<label for="regexpr">Regexp Replace</label><input id="regexpr" cols="40" type="text" value="$1" /><br />')
    }
  }

  function buildPreview() {
      buildRegexp()
      parsetext()
  }

  function handleDataFieldChange() {
      var wantedFields = new Array();
      var fieldAtNumber = {};
      // go through all options and collect wanted (if value not 0)
      for (p = 0; p < $('#num_fields').val(); p++) {
          var value = $('#uriold-'+p).val();
          if (value != 0) {
              var key = $('#uriold-'+p).text();
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
    var fields=dmc.get_topic_type(topicTypeToCreate).fields
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
      for (var i = 0, a = 0, field; field = fields[i]; i++) {
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

  // parse the pasted text
  // apply the regexp
  // return an array of lines 
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

  // go through the user given order of uri to line numbers
  // return array of ids of the uri fields and their according numbers
  function lines_order() {
    var oa = new Array()
    for (var i = 0; i < $('#num_fields').val(); i++) {
      var urio = 'uriold-' + i
      oa[i] = $('#'+urio).val()
    }
    return oa
  }

  // calc max of an array
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
    if (topicTypeToCreate != ui.menu_item("create-type-menu").value) {
        topicTypeToCreate = ui.menu_item("create-type-menu").value
        fillTypeUriTable()
    }
    var lines=do_parse()
    var max_line=max_array(lines_order())
    // clear the textbox and fill it again
    $('#parsedtext').empty()
    // the numbers in front of the line correspond to the line numbers the field uris are related to
    for (i = 0, a = 1; i < lines.length; i++, a++) {
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
  function doCreations() {
    // status
    $('#importerformstatus').empty()
    $('#importerformstatus').append(' importing..')

    // get text
    var lines=do_parse()
    var oa=lines_order()
    var max_line=max_array(oa)
    // ad some more empty lines to be sure to fill up the last (maybe to short) topic with fields
    for ( var i = 0; i < max_line; i++ ) {
      lines.push("")
    }

    // some number magic for placement in rows and cols
    var canvas_width=$('#canvas').width()
    // ### would be handy to query the canvas for the complete layoutBounds of a topicId
    var topic_width = 50
    var topic_height = 50
    var start_x_pos = 10
    var x_pos = start_x_pos
    var y_pos = 10
    // prop will hold the properties of the new topic
    var prop = {}
    // first_topicId will hold the first newly created topic to focus on it afterwards
    var first_topicId = ""
    // go thorugh all lines
    for (var i = 0, a = 1; i < lines.length; i++, a++) {
      // if we have read enough lines create the topic
      if (a > max_line && prop != {}) {
        // create topic
        var topic = create_topic(topicTypeToCreate, prop)
        if (first_topicId == "") {
          first_topicId=topic.id
        }
        // add it to canvas without redraw or selection
        canvas.add_topic(topic.id, topic.type_uri, topic_label(topic), false, false, x_pos, y_pos)
        // if there has been a selevt topic relate to it
        if (topicToRelateTo != "none.") {
          var rel = create_relation("RELATION", topicToRelateTo, topic.id)
          canvas.add_relation(rel.id, rel.src_topic_id, rel.dst_topic_id)
        }
        // prepare for next topic
        a = 1
        prop = {}
        // fill one row till the canvas width is reached, then start a new row by shifting y_pos
        x_pos += topic_width
        if (x_pos >= canvas_width) {
          x_pos = start_x_pos
          y_pos += topic_height
        }
      }
      // ommit empty lines
      if (lines[i] != "") {
        // see which uri will receive this line
        for (p = 0; p < $('#num_fields').val(); p++) {
          if (oa[p] == a) {
            var key = $('#urinew-'+p).text()
            var value = lines[i]
            prop[key.toString()] = value.toString()
          }
        }
      }
    }
    // redraw the canvas and focus on the first created topic
    canvas.refresh()
    if (first_topicId != "") {
      canvas.scroll_topic_to_center(first_topicId)
    }
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
