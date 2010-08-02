function dm3_topicimporter() {

  var LOG_TOPICMAPIMPORTER = false


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

      // get selected topictype in the create menu
      // we will need this later on
      var type_uri = ui.menu_item("create-type-menu").value
      var fields=dmc.get_topic_type(type_uri).fields
      // get the number of user fileds = total number minus the data fields
      var num_fields=fields.length-2
      // hack: i found no better place to store this value to access it later on in private functions
      $('#importerform').append('<input id="num_fields" type="hidden" value="'+num_fields+'" />')

      // rest of the user interface
      // ask user for file
      $('#importerform').append('paste your import text here:<textarea id="importtext" cols="30", rows="2"></textarea><br/>')
      $('#importtext').bind('mouseleave change', parsetext )
      $('#importerform').append('regexp search:<input id="regexps" type="text" value="/(.*)/g"/><br />')
      $('#regexps').bind('mouseleave keyup change', parsetext )
      $('#importerform').append('regexp replace:<input id="regexpr" type="text" value="$1" /><br />')
      $('#regexpr').bind('mouseleave keyup change', parsetext )
      $('#importerform').append('parsed text:<div id="parsedtext"></div>')
      $('#parsedtext').css('height', '200px')
      $('#parsedtext').css('overflow', 'auto')
      $('#parsedtext').css('white-space', 'pre')

      // this part is to match a data field uri with a given line number
      // get uri of datafields
      $('#importerform').append('<table id="uritable"></table>')
      $('#uritable').append('<tr><th">new uri</th><th>match line</th></tr>')
      var selectoptions=""
      for (var i = 1; i <= num_fields; i++) {
        selectoptions+='<option value="'+i+'">'+i+'</option>'
      }
      selectoptions+='<option value="0" selected="selected">-</option>'
        for (var i = 0, a = 0, field; field = fields[i]; i++) {
          // omit the data fields
          if ( field.uri != "de/deepamehta/core/property/DateCreated" &&
            field.uri != "de/deepamehta/core/property/DateModified") {
            var urio = 'uriold-' + a
            $('#uritable').append('<tr><td id="urinew-'+a+'">'+field.uri+'</td>'
              + '<td><select id="'+urio+'" size="1">'+selectoptions+'</select></tr>')
            $('#'+urio).change(parsetext)
            a++
        } 
      }
      // assume the topmost uri is the label, so select this as default for line number 1
      $('#uriold-0 option[value="1"]').attr('selected', 'selected');
      // send button
      $('#importerform').append('<button id="importerformgo">Create</button>')
      $('#importerformgo').click(readtext)
      // status message 
      $('#importerform').append('<span id="importerformstatus">...</span>')
    }
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
    var oa= new Array()
    for (var i = 0; i < $('#num_fields').val(); i++) {
      var urio='uriold-'+i
      oa[i]=$('#'+urio).val()
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
    var lines=do_parse()
    var max_line=max_array(lines_order())
    // clear the textbox and fill it again
    $('#parsedtext').empty()
    // the numbers in front of the line correspond to the line numbers the field uris are related to
    for (i = 0, a = 1; i < lines.length; i++, a++) {
      if (a > max_line) {
        a=1
      }
      if (max_line == 0) { 
        $('#parsedtext').append('-: '+lines[i]+'\n')
      } else {
        $('#parsedtext').append(a+': '+lines[i]+'\n')
      }
    } 
  }   

  // do the work, read the text and create the topics
  function readtext() {
    // status
    $('#importerformstatus').empty()
    $('#importerformstatus').append('importing..')

    // get text
    var lines=do_parse()
    var oa=lines_order()
    var max_line=max_array(oa)
    // ad some more empty lines to be sure to fill up the last (maybe to short) topic with fields
    for ( var i = 0; i < max_line; i++ ) {
      lines.push("")
    }
    // get selected topicid may be undefined
    // if it is defined all newly imported topics will be related to this one
    var topicId = selected_topic
    if ( typeof(topicId) != "undefined" ) {
      topicId = topicId.id
    } else {
      topicId = null
    }

    // uri of the topic type we will create
    var type_uri = ui.menu_item("create-type-menu").value
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
        var topic = create_topic(type_uri, prop)
        if (first_topicId == "") {
          first_topicId=topic.id
        }
        // add it to canvas without redraw or selection
        canvas.add_topic(topic.id, topic.type_uri, topic_label(topic), false, false, x_pos, y_pos)
        // if there has been a selevt topic relate to it
        if (topicId != null) {
          var rel = create_relation("RELATION", topicId, topic.id)
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
      canvas.focus_topic(first_topicId)
    }
    // status
    $('#importerformstatus').empty()
    $('#importerformstatus').append('ready')
  }
}
