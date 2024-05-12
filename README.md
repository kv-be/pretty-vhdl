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

## Multiline support
### Default values
Pretty VHDL supports different coding styles to assign a default value to a constant, variable or signal.

The following conde shows how the allignment for default values works.
```vhdl
-- the line below contains no opening bracket after the assignment symbol, so everything is alligned to the assignment symbol
constant C_CONSTANT : std_logic_vector := first_value and  
                                          second_value;

-- the line below contains an opening bracket after the assignment symbol without anything else, so the next lines get just one indent extra
constant C_CONSTANT : type_whatever := (
  first_value,
  second_value
);

-- the line below contains an opening bracket after the assignment symbol followed by the first part of the initial value, so the next lines are alligned to the first character of the first part of the initial value
constant C_CONSTANT : type_whatever := (first_value,
                                        second_value);
                                
```
### Functions and procedures
For functions and procedures containing a lot of arguments, pretty VHDL forces the format shown in the code extract below. Please notice that the argument declarations expect each argument to be declared on one line. So multiline declarations of arguments of functions or procedures are not supported. Opening and closing brackets are forced to be as in the code snippet below.
```vhdl
function example(
  constant input1  : integer;
  constant input2  : boolean;
  constant output1 : std_logic_vector
) return integer;

procedure example(
  constant input1  : integer;
  constant input2  : boolean;
  constant output1 : std_logic_vector
) is
begin
...
end procedure;

```
### If ... elsif


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
