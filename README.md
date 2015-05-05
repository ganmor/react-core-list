react-infinite-list
===================

This react component turn any list of react components into a infinite list.

This idea is to keep the dom as small as possible by rendering only the elements that are currently in the viewport.
The list accepts element with different sizes, that the tricky part.

Tested on :
chrome latest
firefox latest
Safari mobile 7-8
Chrome Mobile
Android browser

It perform better in browsers that trigger scroll events during scroll momentum



Warning : The bigger the size difference between elements is, the more edge cases you will hit.


Contribute & Build
-------------------------

Build : grunt build

Develop : grunt serve

How does it work :
-----------------

The very basic : 
Only element in the current viewport are in the dom.

In more details :
On each rendering frame, the list check the scroll position if it's before the first rendered element it adds item before if it's after it add elements after. 
If it's way different, ( the new rendered elements and the previous ones do not overlap, it renders at an appoximation of the position based on items mean height.

See demo here : http://ganmor.github.io/react-infinite-list



Example of use :
--------------
 ```
<ReactInfiniteList config={myConfig}>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
  Do not forget to add a key on your components !
 
Caveats :
------ 
- When hiting the bottom of the list we need to adjust this size according to real elements height
- no support of ie, it just a matter of adding the ms prefix in the transform

