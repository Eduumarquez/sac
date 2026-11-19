import type { DivisaoTreino } from "./tipos";

export type InfoExercicio = {
  grupo: string;
  passos: string[];
  dica: string;
  /** exercícios que trabalham o mesmo músculo, para quando o aparelho está ocupado */
  alternativas: string[];
  descansoSeg: number;
};

/** Biblioteca de exercícios: execução, dica de segurança e substitutos. */
export const EXERCICIOS: Record<string, InfoExercicio> = {
  "Supino reto": { grupo: "Peito", descansoSeg: 90, passos: ["Deite com os olhos abaixo da barra e os pés firmes no chão.", "Segure a barra um pouco mais aberto que os ombros.", "Desça até encostar levemente no meio do peito.", "Empurre de volta sem tirar o quadril do banco."], dica: "Mantenha as escápulas juntas e os cotovelos a uns 45 graus do corpo.", alternativas: ["Supino com halteres", "Supino na máquina", "Flexão de braço"] },
  "Supino com halteres": { grupo: "Peito", descansoSeg: 90, passos: ["Deite com um halter em cada mão na altura do peito.", "Empurre para cima até quase estender os braços.", "Desça devagar até os cotovelos passarem um pouco da linha do banco."], dica: "Desça em 2 segundos e suba em 1.", alternativas: ["Supino reto", "Supino na máquina", "Flexão de braço"] },
  "Supino na máquina": { grupo: "Peito", descansoSeg: 75, passos: ["Ajuste o banco para a pegada ficar na altura do meio do peito.", "Empurre até quase estender os braços.", "Volte devagar sem deixar o peso encostar."], dica: "Boa opção para quem treina sozinho, sem precisar de ajuda na barra.", alternativas: ["Supino reto", "Supino com halteres", "Flexão de braço"] },
  "Supino inclinado com halteres": { grupo: "Peito (parte de cima)", descansoSeg: 90, passos: ["Incline o banco entre 30 e 45 graus.", "Empurre os halteres para cima, juntando no alto.", "Desça devagar até a lateral do peito."], dica: "Inclinação demais passa o trabalho para o ombro.", alternativas: ["Supino inclinado na máquina", "Flexão com pés elevados"] },
  "Supino inclinado na máquina": { grupo: "Peito (parte de cima)", descansoSeg: 75, passos: ["Ajuste o assento para a pegada ficar na linha da clavícula.", "Empurre para cima e para a frente.", "Volte devagar."], dica: "Não tire as costas do encosto.", alternativas: ["Supino inclinado com halteres", "Flexão com pés elevados"] },
  "Crucifixo na máquina": { grupo: "Peito", descansoSeg: 60, passos: ["Sente com as costas apoiadas e os cotovelos levemente dobrados.", "Junte as mãos à frente do peito.", "Abra devagar até sentir o peito alongar."], dica: "Os cotovelos ficam fixos: o movimento é de abraço, não de empurrar.", alternativas: ["Crucifixo com halteres", "Crossover na polia"] },
  "Crucifixo com halteres": { grupo: "Peito", descansoSeg: 60, passos: ["Deite com os halteres acima do peito e os cotovelos levemente dobrados.", "Abra os braços em arco até a linha do peito.", "Volte pelo mesmo arco."], dica: "Use carga menor que no supino.", alternativas: ["Crucifixo na máquina", "Crossover na polia"] },
  "Crossover na polia": { grupo: "Peito", descansoSeg: 60, passos: ["Fique no meio da polia com um pé à frente.", "Puxe as alças para baixo e para a frente até se encontrarem.", "Volte devagar."], dica: "Incline o tronco um pouco à frente.", alternativas: ["Crucifixo na máquina", "Crucifixo com halteres"] },
  "Flexão de braço": { grupo: "Peito e tríceps", descansoSeg: 60, passos: ["Mãos um pouco mais abertas que os ombros.", "Corpo reto da cabeça aos pés.", "Desça até o peito quase encostar no chão e suba."], dica: "Ficou difícil? Apoie os joelhos no chão.", alternativas: ["Supino reto", "Supino na máquina"] },
  "Flexão com pés elevados": { grupo: "Peito (parte de cima)", descansoSeg: 60, passos: ["Apoie os pés num banco ou degrau.", "Desça o peito em direção ao chão.", "Empurre de volta mantendo o corpo reto."], dica: "Quanto mais alto o pé, mais difícil.", alternativas: ["Supino inclinado com halteres"] },
  "Tríceps na polia": { grupo: "Tríceps", descansoSeg: 60, passos: ["Segure a barra com os cotovelos colados ao corpo.", "Estenda os braços para baixo.", "Volte até os antebraços ficarem paralelos ao chão."], dica: "Só o antebraço se mexe.", alternativas: ["Tríceps francês com halter", "Mergulho no banco"] },
  "Tríceps francês com halter": { grupo: "Tríceps", descansoSeg: 60, passos: ["Segure um halter com as duas mãos acima da cabeça.", "Desça atrás da cabeça dobrando os cotovelos.", "Estenda de volta."], dica: "Cotovelos apontando para a frente, sem abrir.", alternativas: ["Tríceps na polia", "Mergulho no banco"] },
  "Mergulho no banco": { grupo: "Tríceps", descansoSeg: 60, passos: ["Mãos na borda do banco atrás do corpo.", "Desça dobrando os cotovelos até 90 graus.", "Empurre de volta."], dica: "Em casa, use uma cadeira firme encostada na parede.", alternativas: ["Tríceps na polia", "Tríceps francês com halter"] },
  "Puxada frontal": { grupo: "Costas", descansoSeg: 90, passos: ["Segure a barra aberta, com as coxas presas no apoio.", "Puxe a barra até a parte de cima do peito.", "Volte devagar até esticar os braços."], dica: "Puxe com os cotovelos, não com as mãos, e não balance o tronco.", alternativas: ["Barra fixa assistida", "Remada baixa", "Pulldown com elástico"] },
  "Barra fixa assistida": { grupo: "Costas", descansoSeg: 90, passos: ["Ajuste o peso de ajuda no gráviton.", "Puxe até o queixo passar da barra.", "Desça controlando."], dica: "Quanto mais peso de ajuda, mais fácil.", alternativas: ["Puxada frontal"] },
  "Remada baixa": { grupo: "Costas", descansoSeg: 90, passos: ["Sente com os joelhos levemente dobrados e as costas retas.", "Puxe o triângulo até o umbigo.", "Volte esticando os braços sem curvar as costas."], dica: "Junte as escápulas no final do movimento.", alternativas: ["Remada curvada com halteres", "Remada na máquina"] },
  "Remada curvada com halteres": { grupo: "Costas", descansoSeg: 90, passos: ["Incline o tronco à frente com os joelhos levemente dobrados.", "Puxe os halteres até a cintura.", "Desça devagar."], dica: "Costas retas o tempo todo.", alternativas: ["Remada baixa", "Remada na máquina"] },
  "Remada na máquina": { grupo: "Costas", descansoSeg: 75, passos: ["Apoie o peito no encosto.", "Puxe as alças até a lateral do corpo.", "Volte devagar."], dica: "Não tire o peito do apoio.", alternativas: ["Remada baixa", "Remada curvada com halteres"] },
  "Pulldown com elástico": { grupo: "Costas", descansoSeg: 60, passos: ["Prenda o elástico no alto de uma porta.", "Puxe até a altura do peito.", "Volte devagar."], dica: "Ótimo para viagem: o elástico cabe na mala.", alternativas: ["Puxada frontal"] },
  "Rosca direta": { grupo: "Bíceps", descansoSeg: 60, passos: ["Em pé, segure a barra com as palmas para cima.", "Suba a barra dobrando só os cotovelos.", "Desça devagar até quase esticar."], dica: "Não jogue o quadril para a frente.", alternativas: ["Rosca alternada com halteres", "Rosca na polia"] },
  "Rosca alternada com halteres": { grupo: "Bíceps", descansoSeg: 60, passos: ["Um halter em cada mão, braços ao lado do corpo.", "Suba um braço de cada vez girando a palma para cima.", "Desça devagar."], dica: "Cotovelo parado ao lado do corpo.", alternativas: ["Rosca direta", "Rosca na polia"] },
  "Rosca na polia": { grupo: "Bíceps", descansoSeg: 60, passos: ["Segure a barra da polia baixa.", "Suba dobrando os cotovelos.", "Desça devagar."], dica: "A polia mantém tensão o movimento todo.", alternativas: ["Rosca direta", "Rosca alternada com halteres"] },
  "Agachamento livre": { grupo: "Pernas e glúteos", descansoSeg: 120, passos: ["Pés na largura dos ombros, pontas levemente para fora.", "Desça como se fosse sentar, joelhos na direção dos pés.", "Desça até as coxas ficarem paralelas ao chão, se der.", "Suba empurrando o chão com o pé inteiro."], dica: "Calcanhar no chão e coluna neutra. Joelho pode passar da ponta do pé.", alternativas: ["Leg press", "Agachamento no smith", "Agachamento goblet"] },
  "Agachamento no smith": { grupo: "Pernas e glúteos", descansoSeg: 120, passos: ["Barra apoiada no alto das costas, pés um pouco à frente.", "Desça até as coxas ficarem paralelas ao chão.", "Suba empurrando o chão."], dica: "A guia dá mais segurança para quem está começando.", alternativas: ["Agachamento livre", "Leg press"] },
  "Agachamento goblet": { grupo: "Pernas e glúteos", descansoSeg: 90, passos: ["Segure um halter na frente do peito.", "Agache mantendo o tronco ereto.", "Suba empurrando o chão."], dica: "Ótimo para aprender o agachamento.", alternativas: ["Agachamento livre", "Leg press"] },
  "Agachamento com peso do corpo": { grupo: "Pernas e glúteos", descansoSeg: 45, passos: ["Pés na largura dos ombros, braços à frente.", "Desça como se fosse sentar.", "Suba empurrando o chão."], dica: "Faça devagar: 3 segundos para descer.", alternativas: ["Afundo", "Ponte de glúteo"] },
  "Leg press": { grupo: "Pernas e glúteos", descansoSeg: 90, passos: ["Costas e quadril colados no encosto.", "Pés no meio da plataforma, na largura dos ombros.", "Desça até os joelhos formarem 90 graus.", "Empurre sem travar os joelhos no final."], dica: "Se o quadril sair do encosto, você desceu demais.", alternativas: ["Agachamento livre", "Hack", "Agachamento goblet"] },
  "Hack": { grupo: "Pernas e glúteos", descansoSeg: 90, passos: ["Costas apoiadas e ombros sob as almofadas.", "Desça até 90 graus nos joelhos.", "Suba empurrando a plataforma."], dica: "Pés mais altos trabalham mais glúteo.", alternativas: ["Leg press", "Agachamento no smith"] },
  "Cadeira extensora": { grupo: "Quadríceps", descansoSeg: 60, passos: ["Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina.", "Estenda as pernas até quase esticar.", "Desça devagar."], dica: "Segure 1 segundo lá em cima.", alternativas: ["Afundo", "Agachamento goblet"] },
  "Afundo": { grupo: "Pernas e glúteos", descansoSeg: 60, passos: ["Dê um passo grande à frente.", "Desça o joelho de trás em direção ao chão.", "Volte empurrando com a perna da frente."], dica: "Tronco ereto e joelho da frente alinhado com o pé.", alternativas: ["Cadeira extensora", "Agachamento goblet"] },
  "Ponte de glúteo": { grupo: "Glúteos", descansoSeg: 45, passos: ["Deite de barriga para cima, joelhos dobrados.", "Suba o quadril apertando o glúteo.", "Desça devagar."], dica: "Segure 2 segundos lá em cima.", alternativas: ["Afundo"] },
  "Prancha": { grupo: "Abdômen", descansoSeg: 45, passos: ["Apoie antebraços e pontas dos pés.", "Corpo reto da cabeça aos pés.", "Segure o tempo indicado respirando normalmente."], dica: "Não deixe o quadril cair nem subir.", alternativas: ["Abdominal infra", "Prancha lateral"] },
  "Prancha lateral": { grupo: "Abdômen", descansoSeg: 45, passos: ["Apoie um antebraço e a lateral do pé.", "Suba o quadril até o corpo ficar reto.", "Segure e troque de lado."], dica: "Ficou difícil? Apoie o joelho.", alternativas: ["Prancha"] },
  "Abdominal infra": { grupo: "Abdômen", descansoSeg: 45, passos: ["Deite com as mãos ao lado do corpo.", "Suba as pernas dobradas em direção ao peito.", "Desça devagar sem encostar os pés no chão."], dica: "A lombar fica colada no chão.", alternativas: ["Prancha", "Abdominal no aparelho"] },
  "Abdominal no aparelho": { grupo: "Abdômen", descansoSeg: 45, passos: ["Sente e segure as alças.", "Enrole o tronco para a frente.", "Volte devagar."], dica: "Use carga leve e foque na contração.", alternativas: ["Abdominal infra", "Prancha"] },
  "Esteira (intervalado)": { grupo: "Cardio", descansoSeg: 0, passos: ["Aqueça 3 minutos caminhando.", "Alterne 1 minuto rápido e 2 minutos leve.", "Termine com 3 minutos caminhando."], dica: "No rápido, você deve conseguir falar só frases curtas.", alternativas: ["Bicicleta (intervalado)", "Elíptico"] },
  "Bicicleta (intervalado)": { grupo: "Cardio", descansoSeg: 0, passos: ["Aqueça 3 minutos com carga leve.", "Alterne 1 minuto forte e 2 minutos leve.", "Desacelere nos últimos 3 minutos."], dica: "Ajuste o banco na altura do quadril.", alternativas: ["Esteira (intervalado)", "Elíptico"] },
  "Elíptico": { grupo: "Cardio", descansoSeg: 0, passos: ["Segure as alças móveis.", "Mantenha ritmo constante.", "Aumente a carga a cada 5 minutos."], dica: "Menos impacto no joelho que a corrida.", alternativas: ["Esteira (intervalado)", "Bicicleta (intervalado)"] },
  "Polichinelo": { grupo: "Cardio", descansoSeg: 30, passos: ["Pule abrindo pernas e braços.", "Pule fechando.", "Mantenha o ritmo."], dica: "Joelhos levemente dobrados na aterrissagem.", alternativas: ["Corrida parada"] },
  "Corrida parada": { grupo: "Cardio", descansoSeg: 30, passos: ["Corra no lugar elevando os joelhos.", "Mexa os braços junto.", "Mantenha o ritmo."], dica: "Ótimo para quarto de hotel: não faz barulho.", alternativas: ["Polichinelo"] },
  "Burpee": { grupo: "Corpo inteiro", descansoSeg: 45, passos: ["Agache e apoie as mãos no chão.", "Jogue os pés para trás em prancha.", "Volte os pés e suba com um pequeno salto."], dica: "Sem salto e sem flexão fica mais leve.", alternativas: ["Polichinelo", "Agachamento com peso do corpo"] },
};

export const infoExercicio = (nome: string): InfoExercicio | undefined => EXERCICIOS[nome];

/** Busca de vídeos de execução (abre o YouTube). */
export const linkVideo = (nome: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nome} execução correta`)}`;

/** Treinos prontos para quando o aluno não vai à academia. */
export const TREINOS_FORA: { id: "casa" | "viagem"; titulo: string; descricao: string; divisao: DivisaoTreino }[] = [
  {
    id: "casa", titulo: "Em casa", descricao: "25 minutos, sem equipamento",
    divisao: { nome: "Em casa - corpo inteiro", exercicios: [
      { exercicio: "Polichinelo", series: 2, repeticoes: "40s" },
      { exercicio: "Agachamento com peso do corpo", series: 3, repeticoes: "15" },
      { exercicio: "Flexão de braço", series: 3, repeticoes: "8-12" },
      { exercicio: "Afundo", series: 3, repeticoes: "10 cada perna" },
      { exercicio: "Mergulho no banco", series: 3, repeticoes: "10" },
      { exercicio: "Ponte de glúteo", series: 3, repeticoes: "15" },
      { exercicio: "Prancha", series: 3, repeticoes: "30s" },
    ] },
  },
  {
    id: "viagem", titulo: "Viagem", descricao: "20 minutos, quarto de hotel",
    divisao: { nome: "Viagem - sem barulho", exercicios: [
      { exercicio: "Corrida parada", series: 2, repeticoes: "45s" },
      { exercicio: "Agachamento com peso do corpo", series: 3, repeticoes: "20" },
      { exercicio: "Flexão de braço", series: 3, repeticoes: "10" },
      { exercicio: "Ponte de glúteo", series: 3, repeticoes: "15" },
      { exercicio: "Prancha lateral", series: 2, repeticoes: "20s cada lado" },
      { exercicio: "Burpee", series: 2, repeticoes: "8" },
    ] },
  },
];

/** Opções do editor de treino. */
export const OPCOES_SERIES = [1, 2, 3, 4, 5, 6];
export const OPCOES_REPETICOES = ["6", "8", "10", "12", "15", "20", "6 a 8", "8 a 12", "10 a 15", "até a falha", "30s", "45s", "1 min", "2 min"];
export const NOMES_DIVISAO = [
  "A - Corpo inteiro", "B - Cardio e core",
  "A - Superiores", "B - Inferiores",
  "A - Peito e tríceps", "B - Costas e bíceps", "C - Pernas", "D - Ombros e abdômen",
  "A - Empurrar", "B - Puxar", "C - Pernas e glúteos",
];

/** Exercícios do catálogo para escolher, agrupados por músculo. */
export const opcoesExercicio = () =>
  Object.entries(EXERCICIOS)
    .map(([nome, i]) => ({ valor: nome, texto: nome, grupo: i.grupo }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo) || a.texto.localeCompare(b.texto));
