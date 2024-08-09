const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Initialiser le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Liste des commandes avec leur description
const commands = {
  "!crewhelp": "Affiche la liste des commandes disponibles.",
  "!ping": "Vérifie le ping du bot.",
  "!rejoindre": "Démarre un quiz interactif.",
  "!invite": "Affiche le classement des invitations envoyées.",
  "!annonce": "Envoie une annonce dans le canal dédié.",
  "!rejoindreadmin": "Démarre un quiz pour les candidatures administratives.",
};

// Canaux spécifiques pour les commandes
const channels = {
  joinQuiz: "📄•candidature-equipage", // Remplacez par le nom réel de votre canal
  adminCommands: "commande-admin", // Remplacez par le nom réel de votre canal
  adminApplications: "📄•candidature-admin", // Remplacez par le nom réel de votre canal d'application admin
  generalResponses: "réponses-candidatures-equipage", // Remplacez par le nom réel de votre canal de réponses général
  adminResponses: "réponses-candidature-admin", // Remplacez par le nom réel de votre canal de réponses admin
};

// Chemin du fichier des invitations
const invitesFilePath = path.join(__dirname, "invites.json");

// Liste des questions pour le quiz général
const quizQuestions = [
  { question: "Quel est votre niveau ?" },
  { question: "Le nombre de prime ?" },
  { question: "Quel est votre pseudo Roblox ?" },
  { question: "Par qui avez-vous été invité à rejoindre le serveur ?" },
  { question: "Pourquoi avez-vous choisi cette flotte ?" },
  { question: "Informations personnelles (âge, prénom, etc.) [Facultatif]" },
  // Ajoutez d'autres questions ici
];

// Liste des questions pour les candidatures administratives
const adminQuizQuestions = [
  { question: "Quel âge as-tu ?" },
  { question: "Pourquoi veux-tu rejoindre le staff ?" },
  { question: "As-tu déjà eu des rôles similaires ?" },
  { question: "Quel serait l'avantage de te recruter dans le staff ?" },
  { question: "Quel est ton nom sur Roblox ?" },
  { question: "Quel est ton nom dans la vraie vie ?" },
];

// Liste des questions pour les candidatures entraîneur
const trainerQuizQuestions = [
  { question: "Pourquoi veux-tu ce rôle ?" },
  { question: "Quel est ton niveau sur Blox Fruit ?" },
  { question: "As-tu déjà enseigné des choses à une personne ?" },
  { question: "Es-tu actif dans le serveur ?" },
];

// Lorsque le bot est prêt
client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

// Événement lorsque le bot reçoit un message
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const mentionRegex = new RegExp(`<@!${client.user.id}>|<@${client.user.id}>`);

  // Réponse aux mentions du bot avec salutation spécifique
  if (mentionRegex.test(content)) {
    const salutations = [
      "bonjour",
      "salut",
      "hi",
      "hello",
      "coucou",
      "yo",
      "hey",
      "salem",
    ];
    const salutation = salutations.find((sal) => content.includes(sal));

    if (salutation) {
      message.reply(`${salutation} <@${message.author.id}> comment vas-tu ?`);
    }
  }

  // Réponse à un mot clé spécifique
  if (content.includes("asba")) {
    message.reply("ti bellehi bara nayek");
  }

  // Vérifier si la commande existe dans la liste
  if (content.startsWith("!")) {
    const [command, ...args] = content.split(" ");
    const commandText = command.toLowerCase();

    // Vérifier le canal pour !rejoindre
    if (commandText === "!rejoindre") {
      if (message.channel.name !== channels.joinQuiz) {
        return message.reply(
          `La commande !rejoindre doit être utilisée dans le canal ${channels.joinQuiz}.`
        );
      }
      await startQuiz(message, quizQuestions, channels.generalResponses);
    }
    // Vérifier le canal pour !rejoindreadmin
    else if (commandText === "!rejoindreadmin") {
      if (message.channel.name !== channels.adminApplications) {
        return message.reply(
          `La commande !rejoindreadmin doit être utilisée dans le canal ${channels.adminApplications}.`
        );
      }
      await startQuiz(message, adminQuizQuestions, channels.adminResponses);
    }
    // Vérifier le canal pour les commandes administratives
    else if (Object.keys(commands).includes(commandText)) {
      if (commandText === "!ping") {
        message.reply(`Pong! Latence du bot : ${client.ws.ping} ms.`);
      } else if (commandText === "!crewhelp") {
        const commandList = Object.keys(commands).join(", ");
        message.reply(`Commandes disponibles : ${commandList}`);
      } else if (commandText === "!invite") {
        await displayInvites(message);
      } else if (commandText === "!annonce") {
        if (message.channel.name !== channels.adminCommands) {
          return message.reply(
            `La commande !annonce doit être utilisée dans le canal ${channels.adminCommands}.`
          );
        }
        if (message.member.permissions.has("ADMINISTRATOR")) {
          await handleAnnouncement(message);
        } else {
          message.reply(
            "Vous devez être administrateur pour utiliser cette commande."
          );
        }
      }
    }
  }
});

// Événement lorsque quelqu'un rejoint le serveur
client.on("guildMemberAdd", async (member) => {
  console.log(`${member.user.username} a rejoint le serveur!`);
  await welcomeNewMember(member);
  await updateInviteCount(member);
});

async function welcomeNewMember(member) {
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "✌•𝖇𝖎𝖊𝖓𝖛𝖊𝖓𝖚𝖊"
  );

  if (welcomeChannel) {
    welcomeChannel.send(
      `Bienvenue ${member.user.tag} dans le serveur G.D.SEA N'oubliez pas de consulter les règles.`
    );
  }
}

async function updateInviteCount(member) {
  let invitesData = {};
  try {
    invitesData = JSON.parse(fs.readFileSync(invitesFilePath));
  } catch (error) {
    console.error(
      "Erreur lors de la lecture du fichier d'invitations :",
      error
    );
  }

  const invites = await member.guild.invites.fetch();
  const invite = invites.find(
    (invite) =>
      invite.uses > 0 && invite.inviter && invite.inviter.id === member.user.id
  );

  if (!invite || !invite.inviter) return;

  const inviterId = invite.inviter.id;

  if (!invitesData[inviterId]) {
    invitesData[inviterId] = 0;
  }
  invitesData[inviterId]++;

  fs.writeFileSync(invitesFilePath, JSON.stringify(invitesData, null, 2));
}

async function startQuiz(message, questions, responseChannelName) {
  const responseChannel =
    typeof responseChannelName === "string"
      ? message.guild.channels.cache.find(
          (channel) => channel.name === responseChannelName
        )
      : responseChannelName;

  if (!responseChannel) {
    return message.reply(
      `Le canal des réponses '${responseChannelName}' n'a pas été trouvé.`
    );
  }

  message.reply(`Le questionnaire va commencer ! Répondez dans ce canal.`);

  const userResponses = {};
  const questionMessages = [];
  const userMessageCollector = new Map(); // Pour stocker les messages de réponse des utilisateurs

  for (let i = 0; i < questions.length; i++) {
    const questionData = questions[i];
    const questionMessage = `${i + 1}. ${questionData.question}`;

    const questionSentMessage = await message.channel.send(questionMessage);
    questionMessages.push(questionSentMessage);

    try {
      const collected = await message.channel.awaitMessages({
        max: 1,
        time: 30000,
        errors: ["time"],
      });

      if (collected.size > 0) {
        const userAnswer = collected.first();
        const userId = userAnswer.author.id;

        // Stocker le message de réponse de l'utilisateur pour suppression ultérieure
        if (!userMessageCollector.has(userId)) {
          userMessageCollector.set(userId, []);
        }
        userMessageCollector.get(userId).push(userAnswer);

        if (!userResponses[userId]) {
          userResponses[userId] = [];
        }
        userResponses[userId].push(
          `${questionData.question} : ${userAnswer.content}`
        );
      } else {
        await responseChannel.send(
          `Aucune réponse reçue pour la question ${i + 1} de ${
            message.author.username
          }.`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la collecte des réponses :", error);
    }
  }

  const responsesEmbed = new EmbedBuilder()
    .setTitle(`Réponses du quiz de ${message.author.username}`)
    .setDescription(
      userResponses[message.author.id]?.join("\n") || "Aucune réponse reçue."
    )
    .setColor("#0099ff");

  await responseChannel.send({ embeds: [responsesEmbed] });

  // Supprimer les messages après le quiz
  for (const msg of questionMessages) {
    await msg.delete().catch(console.error);
  }

  // Supprimer les messages de réponse des utilisateurs
  for (const [userId, messages] of userMessageCollector.entries()) {
    for (const msg of messages) {
      try {
        await msg.delete();
      } catch (error) {
        console.error(
          `Erreur lors de la suppression du message de ${userId} :`,
          error
        );
      }
    }
  }

  // Supprimer le message qui a lancé le quiz
  await message.delete().catch(console.error);
}

async function displayInvites(message) {
  try {
    const invites = await message.guild.invites.fetch();
    const members = await message.guild.members.fetch();

    const userInvs = [];

    for (const member of members.values()) {
      const uInvites = invites.filter(
        (u) => u.inviter && u.inviter.id === member.user.id
      );
      let count = 0;

      for (const invite of uInvites.values()) {
        count += invite.uses;
      }

      userInvs.push({ member: member.user.id, invites: count });
    }

    const leaderboard = userInvs
      .sort((a, b) => b.invites - a.invites)
      .slice(0, 10);

    let messageString = "";
    let num = 1;
    for (const value of leaderboard) {
      const member = await message.guild.members.fetch(value.member);
      messageString += `#${num} Membre: **${member.user.username}**, Invitations totales: \`${value.invites}\`\n`;
      num++;
    }

    if (messageString === "") {
      messageString = "Aucun membre n'a encore invité quelqu'un.";
    }

    const embed = new EmbedBuilder()
      .setColor("Blurple")
      .setDescription(`**Total des invitations** \n\n${messageString}`);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur lors de l'affichage des invitations : ", error);
    await message.reply(
      "Une erreur s'est produite en essayant de récupérer les invitations."
    );
  }
}

async function handleAnnouncement(message) {
  // Demander le titre de l'annonce
  message.reply("Veuillez entrer le titre de l'annonce :");

  const filter = (response) => response.author.id === message.author.id;
  const collectedTitle = await message.channel.awaitMessages({
    filter,
    max: 1,
    time: 30000,
    errors: ["time"],
  });

  const title = collectedTitle.first().content;

  // Supprimer le message de demande de titre
  collectedTitle.first().delete().catch(console.error);

  // Demander le contenu de l'annonce
  message.reply("Veuillez entrer le contenu de l'annonce :");
  const collectedContent = await message.channel.awaitMessages({
    filter,
    max: 1,
    time: 30000,
    errors: ["time"],
  });

  const content = collectedContent.first().content;

  // Supprimer le message de demande de contenu
  collectedContent.first().delete().catch(console.error);

  const announcementChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "🔊•𝖆𝖓𝖓𝖔𝖓𝖈𝖊" // Remplacez par le nom réel de votre canal d'annonces
  );

  if (!announcementChannel) {
    return message.reply(
      "Le canal des annonces n'a pas été trouvé. Veuillez le créer ou vérifier son nom."
    );
  }

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(`📢📢 **${title.toUpperCase()}** 📢📢`)
    .setDescription(content)
    .setTimestamp()
    .setFooter({ text: "Annonce du serveur" });

  await announcementChannel.send({ embeds: [embed] });
  console.log("L'annonce a été publiée !");

  // Supprimer les messages de demande de titre et de contenu après avoir publié l'annonce
  const fetchedMessages = await message.channel.messages.fetch({ limit: 10 });
  fetchedMessages.forEach((msg) => {
    if (
      msg.content.includes("Veuillez entrer le titre de l'annonce") ||
      msg.content.includes("Veuillez entrer le contenu de l'annonce")
    ) {
      msg.delete().catch(console.error);
    }
  });
}

client.login(
  "MTI3MDQxMDA5NTcxNjQ2NjgwMA.Gdaahw.TwN2ukSF4OYi8kG6WKpEV8YelQZWMajJwZTy2U"
);
