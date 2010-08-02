Topic Importer Plugin for DeepaMehta 3
======================================

This DeepaMehta Plugin allows you to create a bunch of topics right away from within the DeepaMehta Client. It allows one-time-import only and enables the user to configure his simple data structures like, e.g. HTML Tables copied via the clipboard from another Webpage. For help see some usage examples below.

You can start this Plugin via Menu Item *Special* and then *Topic Importer*. After provding input press *Create* which is to find at the bottom of the Detail Panel.

Requirements
------------

* A DeepaMehta 3 installation  
  <http://github.com/jri/deepamehta3>

Install
-------

The most easy way to use the Topic Importer plugin to install the DeepaMehta 3 binary distribution as it is pre-packaged with the latest Release Candidate. The installation is described here:
<http://github.com/jri/deepamehta3>


Usage Hints
-----------
The Default Functionality creates one Topic with a Name for each line in the Multiline Input Field of the DeepaMehta Detail Panel

*   Feature: Allow to make use of regular expressions syntax to match certain data values in your text. A constantly updated preview area helps to validate the correctness of the current settings.

*   _Note 1_: The Topic Importer always creates topics of the TopicType currently selected in your toolbar above the Panel on the right side. After a change in this DropdownMenu you can notice that at the bottom of the Topic Importer GUI the fields you can fill your data in, have updated according to your selection.

*   _Note 2_: If you select a topic on the canvas before starting the process via "Create", all new topics will get relations to this single topic. Just make sure that you not activate this topic, otherwise your import configuration will be vanished and you have to re-enter it.

Usage Examples
--------------

#### Phonenumber Example
If you have a phonebook which is simple formatted and consists just of "Name, Number", then the following lines are what you need to paste into the correct input fields of the Topic Importer.
input field:
    Mark, 011234567
    Melanie, 003135678
    Mavin, 1101023
regexp search:  `/([^,]*),([^,]*)/g`
regexp replace: `$1\n$2`

Just make sure that you have the "Person" selected in your toolbar and choose Number "2" from the DropdownMenu next to "de/ deepamehta/core/property/Phone" to actually map the "2" regexp match in your line to the field "Phone" of a "Person".

Before you press "Create", just check your settings on correctness through reading the lines in the updated preview field. After this you will have 3 Persons with Name and Phone in your Addressbook.

Version History
---------------

**v0.4** -- August 1, 2010

* Basic functionality
* Compatible with DeepaMehta 3 v0.4

------------
Authors: Torsten Ziegler info aed ziegi.de / Co-Author: Malte Reißig malte aed deepamehta.org
Last Modified: August 2, 2010
