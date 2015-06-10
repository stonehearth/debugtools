local InterruptAi = class()

InterruptAi.name = 'interrupt the currently running action'
InterruptAi.does = 'stonehearth:top'
InterruptAi.args = {}
InterruptAi.version = 2
InterruptAi.priority = 9999999


function InterruptAi:run(ai, entity)
   ai:get_log():info('interrupting ai on debugtool request')
   radiant.events.trigger_async(entity, 'debugtools:ai_interrupted')
   ai:suspend()
end

return InterruptAi
