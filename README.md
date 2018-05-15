A simple tool to allow you to upload an *XLSX* excel file
and have certain columns wiped, and others replaced with an *SHA512*
key, constructed from selected fields within the file.

A live version is available here on [glitch](https://petal-submarine.glitch.me/)

**NOTE:** the entire process happens in memory, with no files being
stored in any temporary file store. This is to ensure that not 
private data is accidentally left on the server on an error. This
also means that there are size limitations placed on the files being uploaded.



```yaml

---
# optional, will be applied to all hashes across all sheets
salt: this is a secret key
# optional: if true, then if any field is missing from the keys, then the
#         entire file will fail
is_strict: True
# a list of translations to apply
translations:
  # what sheet to apply the translations
  - sheet: SheetA
    # from which row (starting at 1) should the translations apply
    # if left out, then every row will be updated
    from_row: 2
    # The column names (A, B, C, etc) used to generate the keys
    key:
      - A
      - B
      - C
    # The column names to be wiped blank - these must be taken
    # from the columns used to generate keys
    # NOTE: the first column, above, will *ALWAYS* be replaced by the
    #     generated key
    hide:
      - A
      - B
```

This will apply a `SHA512` hash over each value in these 
columns, wipe the values that are there, and insert this hash
as the value for the _first_ column. 

It is _astronomically_ unlikely that two different
values would collide.



### Salting

By default, the hash is applied _without_ a salt. If you
wish to use a salt to make it harder to use a rainbow table
to reverse engineer the hidden data, you can use a the `--salt`
parameter to apply one.

**NOTE:** however, this will mean that you **MUST** remember
to apply the _same_ salt to every file, every
time you use this.
