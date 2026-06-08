export type Genero = "masculino" | "feminino" | "unissex"

export type Estacao = "verao" | "inverno" | "primavera" | "outono" | "todas"

export type StatusProduto = "disponivel" | "esgotado" | "inativo"

export type FaixaEtaria = "bebe" | "infantil" | "juvenil" | "adolescente"

export interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  genero: Genero
  faixa_etaria: string
  colecao: string | null
  estacao: Estacao | null
  status: StatusProduto
  fotos: string[]
  criado_em: string
  atualizado_em: string
}

export interface VariacaoEstoque {
  id: string
  produto_id: string
  tamanho: string
  quantidade_total: number
  quantidade_disponivel: number
  quantidade_em_confianca: number
}

export interface ProdutoComVariacoes extends Produto {
  variacoes_estoque: VariacaoEstoque[]
}

export const TAMANHOS_DISPONIVEIS = [
  "RN",
  "P",
  "M",
  "G",
  "1",
  "2",
  "3",
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
] as const

export const FAIXAS_ETARIAS: { value: string; label: string }[] = [
  { value: "Bebê 0-2", label: "Bebê 0-2" },
  { value: "Infantil 3-8", label: "Infantil 3-8" },
  { value: "Juvenil 9-14", label: "Juvenil 9-14" },
  { value: "Adolescente 15-18", label: "Adolescente 15-18" },
]

export const GENEROS: { value: Genero; label: string }[] = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "unissex", label: "Unissex" },
]

export const ESTACOES: { value: Estacao; label: string }[] = [
  { value: "verao", label: "Verão" },
  { value: "inverno", label: "Inverno" },
  { value: "primavera", label: "Primavera" },
  { value: "outono", label: "Outono" },
  { value: "todas", label: "Todas" },
]

export const STATUS_PRODUTO: { value: StatusProduto; label: string }[] = [
  { value: "disponivel", label: "Disponível" },
  { value: "esgotado", label: "Esgotado" },
  { value: "inativo", label: "Inativo" },
]
