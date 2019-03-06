const timeout = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  window.vm = new Vue({
    el: '#app',
    data: {
      apiKey: 'lKfzuApO1ASY*NegoDzU0g((',
      electionAPIBase: 'http://localhost:3000',
      loaded: {
        sites: false,
        elections: false,
        users: false
      },
      activeElectionSite: null,
      activeElection: null,
      elections: [],
      sites: []
    },
    methods: {
      loadSites: async () => {
        console.log('load: sites');
        const response = await fetch(`https://api.stackexchange.com/2.2/sites?pagesize=999&key=${vm.apiKey}`);
        const data = await response.json();
        vm.sites = data.items;
        vm.loaded.sites = true;
        console.log('load: sites done');
      },

      loadElections: async () => {
        console.log('load: elections');
        const response = await fetch(`${vm.electionAPIBase}/api/elections`);
        const data = await response.json();
        vm.elections = vm.sites.filter(x => data.indexOf(x.api_site_parameter) > -1);
        vm.loaded.elections = true;
        console.log('load: elections done');
      },

      selectSite: async election => {
        console.log('load: election data');
        vm.loaded.users = false;
        vm.activeElectionSite = election;
        const response = await fetch(`${vm.electionAPIBase}/api/site/${election.api_site_parameter}`);
        const json = await response.json();
        vm.activeElection = json.data;
        console.log('load: election data done');

        if (!vm.activeElection.activeElection) return;

        console.log('load: user data');
        const getters = json.data.nominations.map(x => new Promise((async resolve => {
          console.log(`      user: ${election.api_site_parameter}-${x.user.id}`);
          await timeout(100);
          const userResponse = await fetch(`${vm.electionAPIBase}/api/user/${election.api_site_parameter}/${x.user.id}`);
          const userJson = await userResponse.json();
          x.user.stats = userJson.data;
          console.log(`      user: ${election.api_site_parameter}-${x.user.id} done`);
          console.log(`            cache: ${userJson.cacheStatus} ${election.api_site_parameter}-${x.user.id}`);
          resolve();
        })));

        await Promise.all(getters);
        console.log('load: user data done');

        vm.loaded.users = true;
      }
    },
    computed: {
      electionURL: () => {
        return vm.activeElectionSite.site_url + '/election';
      }
    }
  });

  await vm.loadSites();
  vm.loadElections();

  $(document).on('click', '.s-tabs--item', ev => {
    const tabpanel = $('#' + $(ev.target).attr('aria-controls'));
    $(ev.target).parent().children().attr('aria-selected', false);
    $(ev.target).attr('aria-selected', true);
    tabpanel.parent().children('[role="tabpanel"]').removeClass('d-block').addClass('d-none');
    tabpanel.removeClass('d-none').addClass('d-block');
  });
});