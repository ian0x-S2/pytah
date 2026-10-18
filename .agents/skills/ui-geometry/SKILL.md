---
name: ui-geometry
description: Revisa e corrige consistência visual de uma UI raciocinando sobre relações entre elementos (alinhamento, espaçamento, padrões repetidos, hierarquia tipográfica, áreas de toque) em vez de opinião, calibrando os parâmetros pelo modo da interface (compact ou comfortable). Use quando o usuário pedir para polir, revisar ou consertar alinhamento, espaçamento ou consistência de uma interface.
---

# UI Geometry

Uma interface é um sistema de relações, não uma coleção de estilos. Todo achado deve ser dito como relação entre dois elementos, com evidência, e nunca como julgamento ("está feio", "precisa de mais espaço").

As regras são as mesmas em qualquer interface. O que muda entre uma UI densa e uma espaçosa são os parâmetros, que ficam em `profiles/`.

## 1. Observar

Colete fatos antes de opinar, nesta ordem de confiabilidade:

1. **Código-fonte**: classes, CSS, tokens e props dos componentes. É a fonte mais confiável e permite achar inconsistências sem renderizar.
2. **Medições do navegador**, se houver ferramenta disponível: posição e tamanho (x, y, largura, altura) e estilos computados (padding, gap, radius, fonte, line-height) dos elementos em questão. Meça só o que a dúvida exige.
3. **Screenshot**: só para checar o resultado visual, nunca como fonte de números. Não estime pixels a olho.

Se você não tem medida de um valor, diga que não tem. Não invente.

## 2. Escolher o modo

Há dois modos: `compact` e `comfortable`. Defina-o antes de aplicar as regras:

1. Se o usuário disse qual é, use esse.
2. Caso contrário, infira do que a interface já faz:
   - gaps dominantes de 4 a 8px, controles de 24 a 32px e corpo de 12 a 14px indicam **compact**;
   - gaps dominantes de 16 a 24px, controles de 40px ou mais e corpo de 15px ou mais indicam **comfortable**.
3. Se o sinal for misto ou fraco, assuma `comfortable` e diga explicitamente que assumiu.

Leia apenas o profile escolhido. Diga no relatório qual modo usou e por quê.

**Precedência:** o padrão que a própria interface adota de forma consistente vale mais que o profile. O profile calibra tolerâncias e julga o que não tem padrão dominante. Se a interface inteira usa 6px de gap e isso é consistente, 6px não é erro, mesmo que a escala do profile não o liste.

## 3. Regras

Cada regra compara elementos entre si. Os números vêm do profile.

**Alinhamento.** Elementos irmãos que fazem sentido alinhar (títulos, descrições, botões de um mesmo bloco) devem compartilhar um eixo (borda esquerda, direita ou centro). Descubra o eixo dominante: o valor que a maioria dos irmãos compartilha. Um elemento dentro da tolerância de quase-acerto do profile é provável erro. Um elemento bem além dessa tolerância (ex.: botão de fechar à direita) é diferença intencional e não é erro.

**Consistência de padrão.** Componentes equivalentes (mesmo papel, mesma estrutura, ex.: cards de uma lista) devem ter o mesmo padding, gap, radius, tipografia e altura. Se a maioria (60% ou mais) usa um valor e um deles diverge, o divergente é o candidato a correção, e o valor esperado vem da própria interface, não do profile. Se não há valor dominante, não conclua nada.

**Escala de espaçamento.** Os espaços usados devem pertencer à escala do profile. Um valor fora da escala, mas a 1px de um valor dentro dela, é severidade baixa. Muitos valores fora da escala, repetidos, indicam fragmentação: reporte como problema do sistema, não como lista de pixels.

**Proximidade e hierarquia espacial.** Elementos relacionados ficam mais próximos entre si do que de elementos não relacionados. A ordem vale em qualquer modo: espaço título→descrição < descrição→conteúdo < entre grupos < entre seções. Se o espaço entre seções é igual ao espaço interno de um grupo, a hierarquia espacial se perdeu. As faixas de cada nível estão no profile.

**Hierarquia tipográfica.** Tamanho e peso decrescem com o nível: h1 > h2 > corpo > metadado. O line-height mínimo e o comprimento de linha aceitável estão no profile.

**Geometria de interação.** A área clicável de todo elemento interativo deve ser pelo menos do tamanho do seu visual e atingir o mínimo do profile. Alvos vizinhos não devem se sobrepor nem ficar tão juntos que dificultem o clique.

**Fragmentação de tokens.** Conte valores distintos de radius, font-size, espaçamento e altura de controle. Muitos valores isolados (usados 1 ou 2 vezes) ao lado de poucos valores recorrentes indicam valores a normalizar. Um valor usado dezenas de vezes nunca é erro. O limite de valores distintos está no profile.

## 4. Confiança e ação

| Tier | Quando | Ação |
| --- | --- | --- |
| high | Verificado no código ou em medição: ≥ 4 elementos equivalentes sustentam o padrão e o desvio é pequeno | Corrija direto |
| medium | Padrão claro mas com poucas evidências, ou desvio inferido sem medição, ou grid com várias colunas | Proponha e espere confirmação |
| low | Heurística (centralização óptica, proporções, "parece") | Apenas relate |

Sem medição real, alinhamento em pixel é no máximo medium. Os ajustes de severidade específicos de cada modo estão no profile.

## 5. Corrigir

Procure a causa, não o sintoma. Um elemento fora do eixo costuma vir de um padding ou gap do pai, ou de uma classe divergente de um componente irmão, não de um `margin-left` solto. Prefira a correção que faz o elemento seguir a mesma regra que seus equivalentes. Faça a menor mudança possível.

## 6. Loop

1. Defina o modo, observe e liste os findings por tier.
2. Corrija os high; proponha os medium; relate os low.
3. Observe de novo os mesmos elementos. Se uma correção criou um problema novo, reverta e relate.
4. Pare quando não restarem high ou após 3 iterações.
5. Confira o resultado com um screenshot.

## 7. Restrições

- Não altere a API pública de componentes nem a hierarquia semântica.
- Não normalize diferenças intencionais.
- Não mude valores só porque estão fora da escala se a interface inteira os usa de forma consistente.
- Não converta uma interface de um modo para o outro, a menos que o usuário peça. Revisar não é redesenhar.

## 8. Como reportar

Cada finding como relação, com evidência: "O botão CTA está 6px à esquerda do eixo compartilhado por 5 de 6 irmãos (x=32)." Comece o relatório com o modo usado e a razão. Termine com: N findings, quantos high, quantos corrigidos, quantos pendentes e o que ficou sem medida.
