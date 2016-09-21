#!/bin/sh
SPEC_DIR=./spec
DOC_DIR=./docs/doc

mkdir -p ${DOC_DIR}
for F in ${SPEC_DIR}/*.spec ; do
  B=`basename $F`
  echo $B
  ${SPEC_DIR}/spec2doc.js $F -o ${DOC_DIR} 
done

