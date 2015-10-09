-- Service for the tracking entities, even after they are destroyed

EntityTrackerService = class()

local track_entities = radiant.util.get_config('track_entities', false)

function EntityTrackerService:initialize()
   if track_entities then
      self._all_entities = {}
      -- listen for every entity creation event sGo we can tear them all down between tests
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

return EntityTrackerService