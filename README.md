# timeline-bootstrap

This contains a simple timeline with collapsible timeline entries.

It is meant to be either `.fork`ed  (read dot-forked) or branched.



### `fork`ing timeline-bootstrap

If it is `.fork`ed, its contents are copied to another repository, along with a `.fork` file containing the version of both repositories at the time of the dot-fork.  You also add an entry in `timeline-bootstrap/.forks` with the same information in a slightly different format.

You may consult this [gist](https://gist.github.com/pflagerd/22bb3e89b56e158b303d7101009112e2) for guidance on how to a) create a `.fork file, and b) how to update `timeline-bootstrap/.forks`.  There are prototype `.fork` and `.forks` files described there.  Those prototypes contain instructions on how to put entries into them.



### branching timeline-bootstrap

If it is branched, `timeline-bootstrap` may be renamed because it will become a subdirectory of the containing project.  The `timeline-bootstrap` repository should be branched with the name of the containing project.  If, for example, the containing project is called `investing`, the branch should be called `investing` also. The timeline might be cloned at `investing/timeline`.  Since it is a nested repository, `timeline` (in this case) should be added to `investing/.gitignore`.



### inline-index-html.mjs

This program can be used to generate a standalone version of `index.html` or `mega-timeline.html`.  It is run thus:

```bash
node inline-index-html.mjs input.html output.html
```

Where `input.html` is either `index.html` or `meta-timeline.html`, and `output.html` is the name of the new standalone version.

Standalone versions are typically copied into another repository directly and are not dot-forked.

The names `inline-index.html` and `inline-meta-timeline.html` are commonly substituted for `output.html`, so they are in `timeline-bootstrap/.gitignore`.