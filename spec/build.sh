#!/bin/sh
mkdir -p ../doc
for F in *.spec ; do
  echo $F
  ./spec2doc.js $F -o ../doc/${F%.spec}.html
done
