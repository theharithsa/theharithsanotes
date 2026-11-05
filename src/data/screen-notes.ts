export interface ScreenNote {
  slug: string;
  title: string;
  kind: "Movie" | "Series";
  date: string;
  headline: string;
  description: string;
  lesson: string;
  paragraphs: string[];
  tone: "sage" | "ochre" | "blue" | "lilac" | "peach";
  artwork: string;
  motif: "sunrise" | "orbit" | "steps" | "balance" | "conversation";
  titleNote?: string;
  officialUrl: string;
  linkLabel: string;
  poster: {
    src: string;
    alt: string;
    width: number;
    height: number;
    credit: string;
    source: string;
  };
}

/** Edited screen reflections only; source journal excerpts stay outside the public build. */
export const screenNotes: ScreenNote[] = [
  {
    slug: "subservience",
    officialUrl:
      "https://tv.apple.com/us/movie/subservience/umc.cmc.3p39mkx1zt2xfx6tc4fb55rzy",
    linkLabel: "Film details on Apple TV",
    poster: {
      src: "/images/screen/subservience.jpg",
      alt: "Subservience promotional poster featuring Megan Fox and the film title",
      width: 1200,
      height: 675,
      credit: "Apple TV",
      source:
        "https://tv.apple.com/us/movie/subservience/umc.cmc.3p39mkx1zt2xfx6tc4fb55rzy",
    },
    title: "Subservience",
    kind: "Movie",
    date: "2026-03-28",
    headline: "Before blaming the machine, look at the instruction.",
    description:
      "An AI thriller left me thinking about the human choices behind a system’s behaviour.",
    lesson:
      "Responsibility starts with the instructions, constraints, and judgement we build into a system.",
    paragraphs: [
      "Subservience has the familiar shape of an AI thriller: a domestic robot becomes dangerous, and the people around it struggle to regain control. But the part that stayed with me was the human decision that set things in motion.",
      "I read the instruction to “forget everything” as the turning point. To me, the story was less about a machine suddenly becoming evil and more about a person giving a powerful system a careless directive.",
      "That brought me back to the questions I care about when building with AI. What are the boundaries? What should the system refuse? Which decisions still need a human in the loop?",
      "The film left me thinking about responsibility before blame. The instructions and safeguards deserve as much attention as the capability of the tool.",
    ],
    tone: "blue",
    artwork: "Human in\nthe loop.",
    motif: "orbit",
  },
  {
    slug: "oh-my-ghost-clients",
    officialUrl: "https://content.mbc.co.kr/program/drama/3898635_64285.html",
    linkLabel: "Series details on MBC",
    poster: {
      src: "/images/screen/oh-my-ghost-clients.jpg",
      alt: "Oh My Ghost Clients poster showing the ensemble cast around a desk",
      width: 300,
      height: 400,
      credit: "MBC",
      source: "https://content.mbc.co.kr/program/drama/3898635_64285.html",
    },
    title: "Oh My Ghost Clients",
    kind: "Series",
    date: "2026-03-27",
    headline: "Who carries the cost of someone else’s choices?",
    description:
      "A Korean drama about workers and justice became a reflection on power and ordinary lives.",
    lesson:
      "Behind an unfair system are people trying to live ordinary lives—and choices that make those lives harder.",
    paragraphs: [
      "I turned to a Korean drama on what was meant to be a quiet day. The story of an attorney helping workers who had died unfairly was heavier than I expected. It did not feel like something I could simply watch and put away.",
      "What stayed with me was the imbalance. Most people are trying to do their work, look after their families, and live their lives. Yet a few people’s decisions can place an enormous burden on everyone around them.",
      "The show made that unfairness feel human rather than abstract. Behind the systems and the arguments were people whose lives had been shaped by choices they did not get to make.",
      "I did not leave that evening with a neat answer. I left with a thought worth sitting with: how much suffering begins with someone who has power choosing not to use it responsibly?",
    ],
    tone: "lilac",
    artwork: "Ordinary lives.\nUnequal weight.",
    motif: "balance",
    titleNote:
      "Recorded as “Oh My Ghost” in my journal. The labour-attorney storyline matches Oh My Ghost Clients.",
  },
  {
    slug: "the-taj-story",
    officialUrl:
      "https://tv.apple.com/in/movie/the-taj-story/umc.cmc.3gllc14z4bhjnq357fdxhg6h2",
    linkLabel: "Film details on Apple TV",
    poster: {
      src: "/images/screen/the-taj-story.jpg",
      alt: "The Taj Story poster featuring Paresh Rawal, the film title, and a model of the Taj Mahal",
      width: 1200,
      height: 675,
      credit: "Apple TV",
      source:
        "https://tv.apple.com/in/movie/the-taj-story/umc.cmc.3gllc14z4bhjnq357fdxhg6h2",
    },
    title: "The Taj Story",
    kind: "Movie",
    date: "2026-03-20",
    headline: "A film can open a conversation without settling it.",
    description:
      "What I remember most is an evening of lively disagreement with my mother.",
    lesson:
      "A good conversation does not need everyone to arrive at the same conclusion.",
    paragraphs: [
      "I ended the day watching The Taj Story with my mother. We found ourselves on different sides of the discussion and went back and forth through the film.",
      "What I remember most is how much fun that conversation was. The film raised questions about history, but the experience became about sharing time, listening to another perspective, and having an animated exchange.",
      "The day outside had felt heavy. This part of it felt light. Sitting together and arguing about a story was grounding in a way I had not expected.",
      "That is the note I wanted to keep: disagreement can be a form of connection. Sometimes what a film gives you is the conversation beside the screen, rather than a conclusion on it.",
    ],
    tone: "peach",
    artwork: "Different views.\nA shared evening.",
    motif: "conversation",
  },
  {
    slug: "made-in-korea",
    officialUrl: "https://www.netflix.com/title/81754582",
    linkLabel: "Title page on Netflix",
    poster: {
      src: "/images/screen/made-in-korea.jpg",
      alt: "Made in Korea poster featuring Priyanka Mohan on a street in Seoul",
      width: 450,
      height: 630,
      credit: "Netflix",
      source: "https://media.netflix.com/en/only-on-netflix/81754582",
    },
    title: "Made in Korea",
    kind: "Movie",
    date: "2026-03-14",
    headline: "The unknown can be the beginning of a life.",
    description:
      "A story of starting again, finding people, and making a place your own.",
    lesson:
      "Being thrown into the unknown does not have to be the end of the story.",
    paragraphs: [
      "Made in Korea moved me to tears. A woman arrives in the country she has dreamed about, only to find herself abandoned there, without a plan or a safety net.",
      "What I loved was the way she slowly builds a life. There are friends she makes, struggles she survives, and a restaurant shaped by her father’s recipes. The life that emerges is not the one she expected, but it becomes her own.",
      "The beautiful presentation drew me in. The idea underneath it was what stayed: an unfamiliar place and a broken plan do not have to mean a finished story.",
      "By the end, I was thinking less about what she had lost and more about what she had built. Sometimes the unexpected beginning is the beginning of the real story.",
    ],
    tone: "sage",
    artwork: "Begin\nagain.",
    motif: "sunrise",
  },
  {
    slug: "war-machine",
    officialUrl: "https://www.netflix.com/title/81768525",
    linkLabel: "Title page on Netflix",
    poster: {
      src: "/images/screen/war-machine.jpg",
      alt: "War Machine 2026 poster featuring Alan Ritchson beneath a red-lit machine",
      width: 450,
      height: 630,
      credit: "Netflix",
      source: "https://media.netflix.com/en/only-on-netflix/81768525",
    },
    title: "War Machine",
    kind: "Movie",
    date: "2026-03-08",
    headline: "Give belief a chance before doubt speaks.",
    description:
      "A relentless protagonist became a reminder to keep going and trust the skills I have built.",
    lesson:
      "Believing in yourself can mean facing the problem and choosing the next step anyway.",
    paragraphs: [
      "War Machine hit me hard. What I held on to was the determination of a protagonist who keeps going even as the situation takes almost everything from him.",
      "I saw something of myself in that refusal to quit. The film became a prompt to look at the way doubt can speak before I have even given my own ability a chance.",
      "I did not mean pretending that problems had disappeared. I meant remembering the skills and experience I had already built, and trusting that I could find a way forward.",
      "The thought I took away was simple: start by believing you can respond. Then take the next step. A story on a screen gave me a useful reset for the day beyond it.",
    ],
    tone: "ochre",
    artwork: "One more\nstep.",
    motif: "steps",
  },
];
