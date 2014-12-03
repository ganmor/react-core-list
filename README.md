react-infinite-list
===================

This react component turn any list of react components into a infinite list.

Use case :
This idea is to keep the dom as small as possible.
This project is mainly target at mobile devices because they are the first to get sluggish when you scroll lists of zillions elements, but it can also be usefull on desktop.


How does it work :
-----------------
- On component mount it creates a div based on a appoximation of the list size.
- Only elements currently in the viewport are rendered ( with some margin )
- On each rendering frame, it compare the new scroll with the rendered position, if it overlaps, it render the missing elements, if it does not overlap is render the list at an appoximation of it's supposed position

See demo here

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
