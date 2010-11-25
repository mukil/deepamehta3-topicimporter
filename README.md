
DeepaMehta 3 Topic Importer
===========================

This DeepaMehta 3 plugin allows you to create a bunch of topics right away from within the DeepaMehta client. It allows one-time-import only and enables the user to configure his simple data structures like, e.g. HTML Tables copied via the clipboard from another webpage.

DeepaMehta 3 is a platform for collaboration and knowledge management.  
<http://github.com/jri/deepamehta3>


Installing
----------

The DeepaMehta 3 Topic Importer plugin is typically installed while the DeepaMehta 3 standard installation.  
See link above.


Usage
-----

You can start this Plugin via Menu Item *Special* and then *Topic Importer*. After provding input press *Create* which is to find at the bottom of the Detail Panel.

The default functionality creates one topic with a name for each line in the multiline input field of the DeepaMehta detail panel.

* Feature: Allow to make use of regular expressions syntax to match certain data values in your text. A constantly updated preview area helps to validate the correctness of the current settings.

* Note 1: The Topic Importer always creates topics of the TopicType currently selected in your toolbar above the Panel on the right side. After a change in this DropdownMenu you can notice that at the bottom of the Topic Importer GUI the fields you can fill your data in, have updated according to your selection.

* Note 2: If you select a topic on the canvas before starting the process via "Create", all new topics will get relations to this single topic. Just make sure that you not activate this topic, otherwise your import configuration will be vanished and you have to re-enter it.

#### Phonenumber Example

If you have a phonebook which is simple formatted and consists just of "Name, Number", then the following lines are what you need to paste into the correct input fields of the Topic Importer.

Input field:

    Mark, 011234567
    Melanie, 003135678
    Mavin, 1101023

Just make sure that you have the "Person" selected in your toolbar and choose Number "2" from the DropdownMenu next to "de/deepamehta/core/property/Phone" to actually map the "2" regexp match in your line to the field "Phone" of a "Person".

Before you press "Start Import", just check your settings on correctness through reading the lines in the updated preview field. After this you will have 3 persons with name and phone in your addressbook.


Version History
---------------

**v0.4.2** -- upcoming

* Compatible with DeepaMehta 3 v0.4.3

**v0.4.1** -- Oct 16, 2010

* Compatible with DeepaMehta 3 v0.4.1

**v0.4** -- August 4, 2010

* Basic functionality
* Compatible with DeepaMehta 3 v0.4


------------
Authors: Torsten Ziegler info aed ziegi.de / Co-Author: Malte Reißig malte aed deepamehta.org  
Last Modified: Nov 25, 2010
