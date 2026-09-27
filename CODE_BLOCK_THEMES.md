# Code block themes — tokenização das cores

Gerado em 2026-09-27 a partir de `src/components/editor/plugins/code-highlight/themes/nord.ts` e `src/components/editor/plugins/code-highlight/themes/everforest.ts` (fonte canônica — não editar à mão, regenere a partir do código). `github` e `catppuccin` são pacotes upstream (`@twinkleplop/theme-*`) e não entram aqui.

Everforest copia verbatim o tema oficial sainnhe/everforest VS Code (`everforest-dark`/`everforest-light` tokenColors); nord copia verbatim o tema oficial arcticicestudio/nord VS Code no dark (`nord` tokenColors) e sombreia cada hue no light até 6.0:1 de contraste sobre Snow Storm. Contraste = WCAG 2.x (AA ≥ 4.5, AAA ≥ 7.0). Everforest e nord-dark são isentos dos mínimos por fidelidade à referência.

## Amostra TSX tokenizada

```tsx
import { Editor } from "@/components/editor/editor";
export function App() {
  return <Editor editable />;
}
```

| Trecho | Token | nord-dark | nord-light | everforest-dark | everforest-light |
| --- | --- | --- | --- | --- | --- |
| `import` | `keyword` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#E67E80` (4.5) | `#F85552` (2.7) |
| `{` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `Editor` | `identifier` | `#D8DEE9` (9.2) | `#3B4252` (8.7) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `}` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `from` | `keyword` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#E67E80` (4.5) | `#F85552` (2.7) |
| `"@/components/editor/editor"` | `string` | `#A3BE8C` (6.1) | `#505E44` (6.0) | `#DBBC7F` (6.8) | `#DFA000` (1.9) |
| `;` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `export` | `keyword` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#E67E80` (4.5) | `#F85552` (2.7) |
| `function` | `keyword` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#E67E80` (4.5) | `#F85552` (2.7) |
| `App` | `function` | `#88C0D0` (6.2) | `#425E67` (6.0) | `#A7C080` (6.2) | `#8DA101` (2.4) |
| `()` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `{` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `return` | `keyword` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#E67E80` (4.5) | `#F85552` (2.7) |
| `<` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `Editor` (JSX) | `tag_name` | `#81A1C1` (4.6) | `#495B6F` (6.1) | `#A7C080` (6.2) | `#8DA101` (2.4) |
| `editable` | `attr_name` | `#8FBCBB` (6.0) | `#475E5E` (6.0) | `#DBBC7F` (6.8) | `#DFA000` (1.9) |
| `/>;` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |
| `}` | `punctuation` | `#ECEFF4` (10.8) | `#2E3440` (10.8) | `#D3C6AA` (7.4) | `#5C6A72` (4.6) |

## nord — dark (bg `#2E3440`)

| Token                   | Cor       | Contraste vs bg |
| ----------------------- | --------- | --------------- |
| `array_table_header`    | `#8FBCBB` | 5.99            |
| `attr_name`             | `#8FBCBB` | 5.99            |
| `attr_sigil`            | `#81A1C1` | 4.64            |
| `attribute`             | `#8FBCBB` | 5.99            |
| `autolink`              | `#88C0D0` | 6.24            |
| `autolink_close`        | `#88C0D0` | 6.24            |
| `autolink_open`         | `#88C0D0` | 6.24            |
| `background_color`      | `#2E3440` | —               |
| `bit`                   | `#B48EAD` | 4.41            |
| `block_scalar_header`   | `#8FBCBB` | 5.99            |
| `blockquote_marker`     | `#8FBCBB` | 5.99            |
| `bold`                  | `#D8DEE9` | 9.25            |
| `bold_close`            | `#D8DEE9` | 9.25            |
| `bold_open`             | `#D8DEE9` | 9.25            |
| `boolean`               | `#81A1C1` | 4.64            |
| `builtin`               | `#88C0D0` | 6.24            |
| `carriage_return`       | `inherit` | —               |
| `changed`               | `#EBCB8B` | 8.00            |
| `changed_marker`        | `#EBCB8B` | 8.00            |
| `class_name`            | `#8FBCBB` | 5.99            |
| `code`                  | `#8FBCBB` | 5.99            |
| `code_block`            | `#D8DEE9` | 9.25            |
| `code_close`            | `#8FBCBB` | 5.99            |
| `code_fence`            | `#8FBCBB` | 5.99            |
| `code_language`         | `#8FBCBB` | 5.99            |
| `code_open`             | `#8FBCBB` | 5.99            |
| `comment`               | `#616E88` | 2.43            |
| `constant`              | `#81A1C1` | 4.64            |
| `css_variable`          | `#D8DEE9` | 9.25            |
| `datetime`              | `#B48EAD` | 4.41            |
| `decorator`             | `#D08770` | 4.39            |
| `deleted`               | `#BF616A` | 3.05            |
| `deleted_marker`        | `#BF616A` | 3.05            |
| `directive`             | `#5E81AC` | 3.10            |
| `doc_marker`            | `#616E88` | 2.43            |
| `doctype`               | `#5E81AC` | 3.10            |
| `entity`                | `#EBCB8B` | 8.00            |
| `escape`                | `#EBCB8B` | 8.00            |
| `expression`            | `#81A1C1` | 4.64            |
| `format`                | `#A3BE8C` | 6.13            |
| `front_matter_marker`   | `#616E88` | 2.43            |
| `function`              | `#88C0D0` | 6.24            |
| `gutter`                | `#4C566A` | 1.69            |
| `hard_break`            | `#616E88` | 2.43            |
| `hash`                  | `#81A1C1` | 4.64            |
| `heading`               | `#88C0D0` | 6.24            |
| `heading_marker`        | `#81A1C1` | 4.64            |
| `hr`                    | `#616E88` | 2.43            |
| `identifier`            | `#D8DEE9` | 9.25            |
| `inserted`              | `#A3BE8C` | 6.13            |
| `inserted_marker`       | `#A3BE8C` | 6.13            |
| `italic`                | `#D8DEE9` | 9.25            |
| `italic_close`          | `#D8DEE9` | 9.25            |
| `italic_open`           | `#D8DEE9` | 9.25            |
| `keyword`               | `#81A1C1` | 4.64            |
| `label`                 | `#8FBCBB` | 5.99            |
| `lifetime`              | `#8FBCBB` | 5.99            |
| `link_text`             | `#88C0D0` | 6.24            |
| `link_text_close`       | `#88C0D0` | 6.24            |
| `link_text_open`        | `#88C0D0` | 6.24            |
| `list_marker`           | `#81A1C1` | 4.64            |
| `namespace`             | `#8FBCBB` | 5.99            |
| `newline`               | `inherit` | —               |
| `null`                  | `#81A1C1` | 4.64            |
| `number`                | `#B48EAD` | 4.41            |
| `operator`              | `#81A1C1` | 4.64            |
| `output`                | `#D8DEE9` | 9.25            |
| `parameter`             | `#D8DEE9` | 9.25            |
| `plain_scalar`          | `#A3BE8C` | 6.13            |
| `prompt`                | `#D8DEE9` | 9.25            |
| `prompt_prefix`         | `#8FBCBB` | 5.99            |
| `property`              | `#D8DEE9` | 9.25            |
| `punctuation`           | `#ECEFF4` | 10.84           |
| `raw_code_block`        | `#D8DEE9` | 9.25            |
| `raw_front_matter`      | `#D8DEE9` | 9.25            |
| `raw_json`              | `#D8DEE9` | 9.25            |
| `raw_markup`            | `#D8DEE9` | 9.25            |
| `raw_script`            | `#D8DEE9` | 9.25            |
| `raw_shell`             | `#D8DEE9` | 9.25            |
| `raw_style`             | `#D8DEE9` | 9.25            |
| `raw_svelte_expression` | `#D8DEE9` | 9.25            |
| `regex`                 | `#EBCB8B` | 8.00            |
| `selector`              | `#81A1C1` | 4.64            |
| `selector_class`        | `#8FBCBB` | 5.99            |
| `selector_id`           | `#8FBCBB` | 5.99            |
| `selector_pseudo`       | `#81A1C1` | 4.64            |
| `space`                 | `inherit` | —               |
| `strike`                | `#616E88` | 2.43            |
| `strike_close`          | `#616E88` | 2.43            |
| `strike_open`           | `#616E88` | 2.43            |
| `string`                | `#A3BE8C` | 6.13            |
| `string_escape`         | `#EBCB8B` | 8.00            |
| `svelte_block`          | `#81A1C1` | 4.64            |
| `svelte_directive`      | `#8FBCBB` | 5.99            |
| `tab`                   | `inherit` | —               |
| `tag`                   | `#81A1C1` | 4.64            |
| `tag_name`              | `#81A1C1` | 4.64            |
| `task_marker`           | `#88C0D0` | 6.24            |
| `template`              | `#A3BE8C` | 6.13            |
| `type`                  | `#8FBCBB` | 5.99            |
| `unit`                  | `#D8DEE9` | 9.25            |
| `url`                   | `#88C0D0` | 6.24            |
| `url_link`              | `#88C0D0` | 6.24            |
| `url_title`             | `#88C0D0` | 6.24            |
| `variable`              | `#D8DEE9` | 9.25            |
| `variant`               | `#8FBCBB` | 5.99            |

## nord — light (bg `#ECEFF4`)

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

## everforest — dark (bg `#2D353B`)

| Token                   | Cor       | Contraste vs bg |
| ----------------------- | --------- | --------------- |
| `array_table_header`    | `#D699B6` | 5.40            |
| `attr_name`             | `#DBBC7F` | 6.84            |
| `attr_sigil`            | `#D3C6AA` | 7.38            |
| `attribute`             | `#DBBC7F` | 6.84            |
| `autolink`              | `#A7C080` | 6.23            |
| `autolink_close`        | `#A7C080` | 6.23            |
| `autolink_open`         | `#A7C080` | 6.23            |
| `background_color`      | `#2D353B` | —               |
| `bit`                   | `#D699B6` | 5.40            |
| `block_scalar_header`   | `#E67E80` | 4.55            |
| `blockquote_marker`     | `#859289` | 3.84            |
| `bold`                  | `#D3C6AA` | 7.38            |
| `bold_close`            | `#D3C6AA` | 7.38            |
| `bold_open`             | `#D3C6AA` | 7.38            |
| `boolean`               | `#D699B6` | 5.40            |
| `builtin`               | `#A7C080` | 6.23            |
| `carriage_return`       | `INHERIT` | —               |
| `changed`               | `#7FBBB3` | 5.74            |
| `changed_marker`        | `#7FBBB3` | 5.74            |
| `class_name`            | `#7FBBB3` | 5.74            |
| `code`                  | `#A7C080` | 6.23            |
| `code_block`            | `#D3C6AA` | 7.38            |
| `code_close`            | `#A7C080` | 6.23            |
| `code_fence`            | `#859289` | 3.84            |
| `code_language`         | `#DBBC7F` | 6.84            |
| `code_open`             | `#A7C080` | 6.23            |
| `comment`               | `#859289` | 3.84            |
| `constant`              | `#D699B6` | 5.40            |
| `css_variable`          | `#83C092` | 5.89            |
| `datetime`              | `#D699B6` | 5.40            |
| `decorator`             | `#83C092` | 5.89            |
| `deleted`               | `#E67E80` | 4.55            |
| `deleted_marker`        | `#E67E80` | 4.55            |
| `directive`             | `#83C092` | 5.89            |
| `doc_marker`            | `#859289` | 3.84            |
| `doctype`               | `#859289` | 3.84            |
| `entity`                | `#D3C6AA` | 7.38            |
| `escape`                | `#A7C080` | 6.23            |
| `expression`            | `#A7C080` | 6.23            |
| `format`                | `#D3C6AA` | 7.38            |
| `front_matter_marker`   | `#859289` | 3.84            |
| `function`              | `#A7C080` | 6.23            |
| `hard_break`            | `#859289` | 3.84            |
| `hash`                  | `#859289` | 3.84            |
| `heading`               | `#E67E80` | 4.55            |
| `heading_marker`        | `#859289` | 3.84            |
| `hr`                    | `#859289` | 3.84            |
| `identifier`            | `#D3C6AA` | 7.38            |
| `inserted`              | `#A7C080` | 6.23            |
| `inserted_marker`       | `#A7C080` | 6.23            |
| `italic`                | `#D3C6AA` | 7.38            |
| `italic_close`          | `#D3C6AA` | 7.38            |
| `italic_open`           | `#D3C6AA` | 7.38            |
| `keyword`               | `#E67E80` | 4.55            |
| `label`                 | `#83C092` | 5.89            |
| `lifetime`              | `#E69875` | 5.41            |
| `link_text`             | `#D699B6` | 5.40            |
| `link_text_close`       | `#D699B6` | 5.40            |
| `link_text_open`        | `#D699B6` | 5.40            |
| `list_marker`           | `#E67E80` | 4.55            |
| `namespace`             | `#7FBBB3` | 5.74            |
| `newline`               | `INHERIT` | —               |
| `null`                  | `#D699B6` | 5.40            |
| `number`                | `#D699B6` | 5.40            |
| `operator`              | `#E69875` | 5.41            |
| `output`                | `#D3C6AA` | 7.38            |
| `parameter`             | `#D3C6AA` | 7.38            |
| `plain_scalar`          | `#D3C6AA` | 7.38            |
| `prompt`                | `#D3C6AA` | 7.38            |
| `prompt_prefix`         | `#A7C080` | 6.23            |
| `property`              | `#D3C6AA` | 7.38            |
| `punctuation`           | `#D3C6AA` | 7.38            |
| `raw_code_block`        | `#D3C6AA` | 7.38            |
| `raw_front_matter`      | `#D3C6AA` | 7.38            |
| `raw_json`              | `#D3C6AA` | 7.38            |
| `raw_markup`            | `#D3C6AA` | 7.38            |
| `raw_script`            | `#D3C6AA` | 7.38            |
| `raw_shell`             | `#D3C6AA` | 7.38            |
| `raw_style`             | `#D3C6AA` | 7.38            |
| `raw_svelte_expression` | `#D3C6AA` | 7.38            |
| `regex`                 | `#DBBC7F` | 6.84            |
| `selector`              | `#D699B6` | 5.40            |
| `selector_class`        | `#E67E80` | 4.55            |
| `selector_id`           | `#E67E80` | 4.55            |
| `selector_pseudo`       | `#DBBC7F` | 6.84            |
| `space`                 | `INHERIT` | —               |
| `strike`                | `#859289` | 3.84            |
| `strike_close`          | `#859289` | 3.84            |
| `strike_open`           | `#859289` | 3.84            |
| `string`                | `#DBBC7F` | 6.84            |
| `string_escape`         | `#A7C080` | 6.23            |
| `svelte_block`          | `#83C092` | 5.89            |
| `svelte_directive`      | `#A7C080` | 6.23            |
| `tab`                   | `INHERIT` | —               |
| `tag`                   | `#E69875` | 5.41            |
| `tag_name`              | `#A7C080` | 6.23            |
| `task_marker`           | `#A7C080` | 6.23            |
| `template`              | `#DBBC7F` | 6.84            |
| `type`                  | `#7FBBB3` | 5.74            |
| `unit`                  | `#E69875` | 5.41            |
| `url`                   | `#A7C080` | 6.23            |
| `url_link`              | `#A7C080` | 6.23            |
| `url_title`             | `#D699B6` | 5.40            |
| `variable`              | `#D3C6AA` | 7.38            |
| `variant`               | `#7FBBB3` | 5.74            |

## everforest — light (bg `#EEE9D9`)

| Token                   | Cor       | Contraste vs bg |
| ----------------------- | --------- | --------------- |
| `array_table_header`    | `#DF69BA` | 2.52            |
| `attr_name`             | `#DFA000` | 1.89            |
| `attr_sigil`            | `#5C6A72` | 4.60            |
| `attribute`             | `#DFA000` | 1.89            |
| `autolink`              | `#8DA101` | 2.39            |
| `autolink_close`        | `#8DA101` | 2.39            |
| `autolink_open`         | `#8DA101` | 2.39            |
| `background_color`      | `#EEE9D9` | —               |
| `bit`                   | `#DF69BA` | 2.52            |
| `block_scalar_header`   | `#F85552` | 2.70            |
| `blockquote_marker`     | `#939F91` | 2.27            |
| `bold`                  | `#5C6A72` | 4.60            |
| `bold_close`            | `#5C6A72` | 4.60            |
| `bold_open`             | `#5C6A72` | 4.60            |
| `boolean`               | `#DF69BA` | 2.52            |
| `builtin`               | `#8DA101` | 2.39            |
| `carriage_return`       | `INHERIT` | —               |
| `changed`               | `#3A94C5` | 2.78            |
| `changed_marker`        | `#3A94C5` | 2.78            |
| `class_name`            | `#3A94C5` | 2.78            |
| `code`                  | `#8DA101` | 2.39            |
| `code_block`            | `#5C6A72` | 4.60            |
| `code_close`            | `#8DA101` | 2.39            |
| `code_fence`            | `#939F91` | 2.27            |
| `code_language`         | `#DFA000` | 1.89            |
| `code_open`             | `#8DA101` | 2.39            |
| `comment`               | `#939F91` | 2.27            |
| `constant`              | `#DF69BA` | 2.52            |
| `css_variable`          | `#35A77C` | 2.48            |
| `datetime`              | `#DF69BA` | 2.52            |
| `decorator`             | `#35A77C` | 2.48            |
| `deleted`               | `#F85552` | 2.70            |
| `deleted_marker`        | `#F85552` | 2.70            |
| `directive`             | `#35A77C` | 2.48            |
| `doc_marker`            | `#939F91` | 2.27            |
| `doctype`               | `#939F91` | 2.27            |
| `entity`                | `#5C6A72` | 4.60            |
| `escape`                | `#8DA101` | 2.39            |
| `expression`            | `#8DA101` | 2.39            |
| `format`                | `#5C6A72` | 4.60            |
| `front_matter_marker`   | `#939F91` | 2.27            |
| `function`              | `#8DA101` | 2.39            |
| `hard_break`            | `#939F91` | 2.27            |
| `hash`                  | `#939F91` | 2.27            |
| `heading`               | `#F85552` | 2.70            |
| `heading_marker`        | `#939F91` | 2.27            |
| `hr`                    | `#939F91` | 2.27            |
| `identifier`            | `#5C6A72` | 4.60            |
| `inserted`              | `#8DA101` | 2.39            |
| `inserted_marker`       | `#8DA101` | 2.39            |
| `italic`                | `#5C6A72` | 4.60            |
| `italic_close`          | `#5C6A72` | 4.60            |
| `italic_open`           | `#5C6A72` | 4.60            |
| `keyword`               | `#F85552` | 2.70            |
| `label`                 | `#35A77C` | 2.48            |
| `lifetime`              | `#F57D26` | 2.20            |
| `link_text`             | `#DF69BA` | 2.52            |
| `link_text_close`       | `#DF69BA` | 2.52            |
| `link_text_open`        | `#DF69BA` | 2.52            |
| `list_marker`           | `#F85552` | 2.70            |
| `namespace`             | `#3A94C5` | 2.78            |
| `newline`               | `INHERIT` | —               |
| `null`                  | `#DF69BA` | 2.52            |
| `number`                | `#DF69BA` | 2.52            |
| `operator`              | `#F57D26` | 2.20            |
| `output`                | `#5C6A72` | 4.60            |
| `parameter`             | `#5C6A72` | 4.60            |
| `plain_scalar`          | `#5C6A72` | 4.60            |
| `prompt`                | `#5C6A72` | 4.60            |
| `prompt_prefix`         | `#8DA101` | 2.39            |
| `property`              | `#5C6A72` | 4.60            |
| `punctuation`           | `#5C6A72` | 4.60            |
| `raw_code_block`        | `#5C6A72` | 4.60            |
| `raw_front_matter`      | `#5C6A72` | 4.60            |
| `raw_json`              | `#5C6A72` | 4.60            |
| `raw_markup`            | `#5C6A72` | 4.60            |
| `raw_script`            | `#5C6A72` | 4.60            |
| `raw_shell`             | `#5C6A72` | 4.60            |
| `raw_style`             | `#5C6A72` | 4.60            |
| `raw_svelte_expression` | `#5C6A72` | 4.60            |
| `regex`                 | `#DFA000` | 1.89            |
| `selector`              | `#DF69BA` | 2.52            |
| `selector_class`        | `#F85552` | 2.70            |
| `selector_id`           | `#F85552` | 2.70            |
| `selector_pseudo`       | `#DFA000` | 1.89            |
| `space`                 | `INHERIT` | —               |
| `strike`                | `#939F91` | 2.27            |
| `strike_close`          | `#939F91` | 2.27            |
| `strike_open`           | `#939F91` | 2.27            |
| `string`                | `#DFA000` | 1.89            |
| `string_escape`         | `#8DA101` | 2.39            |
| `svelte_block`          | `#35A77C` | 2.48            |
| `svelte_directive`      | `#8DA101` | 2.39            |
| `tab`                   | `INHERIT` | —               |
| `tag`                   | `#F57D26` | 2.20            |
| `tag_name`              | `#8DA101` | 2.39            |
| `task_marker`           | `#8DA101` | 2.39            |
| `template`              | `#DFA000` | 1.89            |
| `type`                  | `#3A94C5` | 2.78            |
| `unit`                  | `#F57D26` | 2.20            |
| `url`                   | `#8DA101` | 2.39            |
| `url_link`              | `#8DA101` | 2.39            |
| `url_title`             | `#DF69BA` | 2.52            |
| `variable`              | `#5C6A72` | 4.60            |
| `variant`               | `#3A94C5` | 2.78            |
