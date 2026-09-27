# Nord Light — tokens do code block

Gerado a partir de `src/components/editor/plugins/code-highlight/themes/nord.ts` (paleta `light`). Não editar à mão — a fonte canônica é o código.

Fundo: `#ECEFF4` (Snow Storm) · texto base: `#2E3440`. O light sombreia cada hue oficial em direção ao preto até atingir **6.0:1** de contraste (piso anterior era 4.5:1, colado no mínimo AA sem margem). O dark continua verbatim do Nord VS Code oficial (`displayName: Nord`).

## Tokens (bg `#ECEFF4`)

| Token                   | Cor       | Contraste vs bg |
| ----------------------- | --------- | --------------- |
| `array_table_header`    | `#475E5E` | 6.01            |
| `attr_name`             | `#475E5E` | 6.01            |
| `attr_sigil`            | `#495B6F` | 6.05            |
| `attribute`             | `#475E5E` | 6.01            |
| `autolink`              | `#425E67` | 6.02            |
| `autolink_close`        | `#425E67` | 6.02            |
| `autolink_open`         | `#425E67` | 6.02            |
| `background_color`      | `#ECEFF4` | —               |
| `bit`                   | `#6A5266` | 6.05            |
| `block_scalar_header`   | `#475E5E` | 6.01            |
| `blockquote_marker`     | `#475E5E` | 6.01            |
| `bold`                  | `#2E3440` | 10.84           |
| `bold_close`            | `#2E3440` | 10.84           |
| `bold_open`             | `#2E3440` | 10.84           |
| `boolean`               | `#495B6F` | 6.05            |
| `builtin`               | `#425E67` | 6.02            |
| `carriage_return`       | `inherit` | —               |
| `changed`               | `#67583A` | 6.01            |
| `changed_marker`        | `#67583A` | 6.01            |
| `class_name`            | `#475E5E` | 6.01            |
| `code`                  | `#475E5E` | 6.01            |
| `code_block`            | `#2E3440` | 10.84           |
| `code_close`            | `#475E5E` | 6.01            |
| `code_fence`            | `#475E5E` | 6.01            |
| `code_language`         | `#475E5E` | 6.01            |
| `code_open`             | `#475E5E` | 6.01            |
| `comment`               | `#4C566A` | 6.40            |
| `constant`              | `#495B6F` | 6.05            |
| `css_variable`          | `#2E3440` | 10.84           |
| `datetime`              | `#6A5266` | 6.05            |
| `decorator`             | `#7C4E41` | 6.03            |
| `deleted`               | `#8A454C` | 6.00            |
| `deleted_marker`        | `#8A454C` | 6.00            |
| `directive`             | `#415B7B` | 6.06            |
| `doc_marker`            | `#4C566A` | 6.40            |
| `doctype`               | `#415B7B` | 6.06            |
| `entity`                | `#67583A` | 6.01            |
| `escape`                | `#67583A` | 6.01            |
| `expression`            | `#495B6F` | 6.05            |
| `format`                | `#505E44` | 6.02            |
| `front_matter_marker`   | `#4C566A` | 6.40            |
| `function`              | `#425E67` | 6.02            |
| `gutter`                | `#4C566A` | 6.40            |
| `hard_break`            | `#4C566A` | 6.40            |
| `hash`                  | `#495B6F` | 6.05            |
| `heading`               | `#425E67` | 6.02            |
| `heading_marker`        | `#495B6F` | 6.05            |
| `hr`                    | `#4C566A` | 6.40            |
| `identifier`            | `#3B4252` | 8.73            |
| `inserted`              | `#505E44` | 6.02            |
| `inserted_marker`       | `#505E44` | 6.02            |
| `italic`                | `#2E3440` | 10.84           |
| `italic_close`          | `#2E3440` | 10.84           |
| `italic_open`           | `#2E3440` | 10.84           |
| `keyword`               | `#495B6F` | 6.05            |
| `label`                 | `#475E5E` | 6.01            |
| `lifetime`              | `#475E5E` | 6.01            |
| `link_text`             | `#425E67` | 6.02            |
| `link_text_close`       | `#425E67` | 6.02            |
| `link_text_open`        | `#425E67` | 6.02            |
| `list_marker`           | `#495B6F` | 6.05            |
| `namespace`             | `#475E5E` | 6.01            |
| `newline`               | `inherit` | —               |
| `null`                  | `#495B6F` | 6.05            |
| `number`                | `#6A5266` | 6.05            |
| `operator`              | `#495B6F` | 6.05            |
| `output`                | `#2E3440` | 10.84           |
| `parameter`             | `#3B4252` | 8.73            |
| `plain_scalar`          | `#505E44` | 6.02            |
| `prompt`                | `#2E3440` | 10.84           |
| `prompt_prefix`         | `#475E5E` | 6.01            |
| `property`              | `#2E3440` | 10.84           |
| `punctuation`           | `#2E3440` | 10.84           |
| `raw_code_block`        | `#2E3440` | 10.84           |
| `raw_front_matter`      | `#2E3440` | 10.84           |
| `raw_json`              | `#2E3440` | 10.84           |
| `raw_markup`            | `#2E3440` | 10.84           |
| `raw_script`            | `#2E3440` | 10.84           |
| `raw_shell`             | `#2E3440` | 10.84           |
| `raw_style`             | `#2E3440` | 10.84           |
| `raw_svelte_expression` | `#2E3440` | 10.84           |
| `regex`                 | `#67583A` | 6.01            |
| `selector`              | `#495B6F` | 6.05            |
| `selector_class`        | `#475E5E` | 6.01            |
| `selector_id`           | `#475E5E` | 6.01            |
| `selector_pseudo`       | `#495B6F` | 6.05            |
| `space`                 | `inherit` | —               |
| `strike`                | `#4C566A` | 6.40            |
| `strike_close`          | `#4C566A` | 6.40            |
| `strike_open`           | `#4C566A` | 6.40            |
| `string`                | `#505E44` | 6.02            |
| `string_escape`         | `#67583A` | 6.01            |
| `svelte_block`          | `#495B6F` | 6.05            |
| `svelte_directive`      | `#475E5E` | 6.01            |
| `tab`                   | `inherit` | —               |
| `tag`                   | `#495B6F` | 6.05            |
| `tag_name`              | `#495B6F` | 6.05            |
| `task_marker`           | `#425E67` | 6.02            |
| `template`              | `#505E44` | 6.02            |
| `type`                  | `#475E5E` | 6.01            |
| `unit`                  | `#2E3440` | 10.84           |
| `url`                   | `#425E67` | 6.02            |
| `url_link`              | `#425E67` | 6.02            |
| `url_title`             | `#425E67` | 6.02            |
| `variable`              | `#3B4252` | 8.73            |
| `variant`               | `#475E5E` | 6.01            |

## Estilos de fonte (`theme_styles`)

| Token       | Estilos       |
| ----------- | ------------- |
| `autolink`  | underline     |
| `bold`      | bold          |
| `italic`    | italic        |
| `link_text` | underline     |
| `strike`    | strikethrough |
| `url`       | underline     |
| `url_link`  | underline     |
| `url_title` | underline     |
