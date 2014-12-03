react-infinite-list
===================

This react component turn any list of react components into a infinite list.

WARNING : While working, this component is still a proof of concept

This idea is to keep the dom as small as possible by rendering only the elements that are currently in the viewport.
This project is mainly targeted at mobile devices because they are the first to get sluggish when you scroll lists of zillions elements, but it can also be usefull on desktop.
Elements can be different heights ( This is the tricky part ), but the biggerr the size differences between elements is the more edge cases you will hit.


How does it work :
-----------------
- On component mount it creates a div based on a appoximation of the list size.
- Only elements currently in the viewport are rendered ( with some margin )
- On each rendering frame, it compare the new scroll with the rendered position, if it overlaps, it render the missing elements, if it does not overlap is render the list at an appoximation of it's supposed position

See demo here : http://ganmor.github.io/react-infinite-list

Example of use :
--------------
 ```
var myListOfReactComponents = _.map(MyLargeJSONDataset, function (element) {
  return (<MyReactClassForElement element={element} key={element.id} />);
});

<ReactInfiniteList>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
 
Caveats :
------ 
