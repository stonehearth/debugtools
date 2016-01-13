-- Service for the tracking entities, even after they are destroyed

EntityTrackerService = class()

local track_entities = radiant.util.get_config('track_entities', false)

function EntityTrackerService:initialize()
   self._sv = self.__saved_variables:get_data()

   if not self._sv._initialized then
      self._sv._initialized = true
      self._sv.entities = {}
   end

   if track_entities then
      self._all_entities = {}
      -- listen for every entity creation event so we can tear them all down between tests
      radiant.events.listen(radiant, 'radiant:entity:post_create', function(e)
            local entity = e.entity
            local id = entity:get_id()
            self._all_entities[id] = tostring(entity)
         end)
   end
end

function EntityTrackerService:get_entity_info_command(session, response, id)
   if not track_entities then
      return 'Entity tracker is not enabled. Set mods.debugtools.track_entities=true'
   end
   return self._all_entities[id]
end

function EntityTrackerService:load_entities_command(session, response)
   local all_entities = _radiant.sim.get_all_entities()
   local count = 0
   if all_entities then
      for id, entity in pairs(all_entities) do
         local uri = entity:get_uri()
         local info = self._sv.entities[uri]
         if not info then
            local save_variables = radiant.create_datastore()
            save_variables:get_data().entities = {}
            info = {
               count = 0,
               data = save_variables
            }

            self._sv.entities[uri] = info
         end
         local entities_table = info.data:get_data().entities
         table.insert(entities_table, entity)
         info.count = info.count + 1
         count = count + 1
      end
   end
   self.__saved_variables:mark_changed()
   return 'loaded ' ..count .. ' entities'
end

return EntityTrackerService