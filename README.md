# Pretty VHDL

VHDL Formatter for Visual Studio Code

## Usage

### Using Command Palette

- macOS: `CMD` + `SHIFT` + `P`
- Windows: `CTRL` + `SHIFT` + `P`

And type `Format Document`

### Keyboard Shortcuts

- macOS: `SHIFT` + `OPTION` + `F`
- Windows: `SHIFT` + `ALT` + `F`

If you don't like the defaults shortcuts, you can rebind `editor.action.formatDocument`in the keyboard shortcuts menu of VSCode.

## Demo

![Demo](https://github.com/kv-be/pretty-vhdl/raw/main/resources/entity.gif)


VHDL pretty also provides Deltatec coding style compliant VHDL templates with the following shortcuts:

  | shortcut  | Description
  |-----------|--------------------------------------------------------|
  |  hdr      | inserts  the deltatec header                           |
  |  ent      | inserts standard libs and the entity declaration       |
  |  arch     | inserts the architecture template                      |
  |  enta     | same as ent and arch after each other                  |
  |  nf       | (new file): inserts a complete template for a VHDL file|
  |  cas      | inserts a case template                                |
  |  rec      | inserts a record template                              |
  |  forl     | inserts a for loop template                            |
  |  forg     | inserts a for generate template                        |
  |  if       | inserts an if template                                 |
  |  ifwe     | inserts an if - else template                          |
  |  ifg      | inserts an if - generate template                      |
  |  func     | inserts a function template                            |
  |  proc     | process template                                       |
  |  slv      | std_logic_vector                                       |
  |  uns      | unsigned                                               |
  |  var      | variable                                               |
  |  int      | integer                                                |
  |  dt       | downto                                                 |
  |  sig      | signal                                                 |
  |  pack     | complete package template  (with header)               |
  |  while    | while template                                         |
  |  pro      | a combinatorial process                                |
  |  spro     | a synchronous process                                  |
  |  o0       | (others => '0')                                        |
  |  o1       | (others => '1')                                        |
  

## Credits

[VHDL Formatter by vinrobot](https://marketplace.visualstudio.com/items?itemName=Vinrobot.vhdl-formatter)
