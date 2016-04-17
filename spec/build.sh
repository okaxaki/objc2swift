#!/bin/sh
DOCROOT=../../objc2swift-gh-pages/doc

if [ ! -e "${DOCROOT}" ] ; then
	echo ${DOCROOT} does not exists.
	exit 1
fi

for F in *.spec ; do
  echo $F
  ./spec2doc.js $F -o ${DOCROOT} ${F%.spec}.html
done
